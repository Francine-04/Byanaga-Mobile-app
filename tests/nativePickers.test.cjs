const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function mount(filename, platform, value) {
  const state = [];
  let cursor = 0;
  const changes = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useMemo: (factory) => factory(),
    useState: (initial) => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], (next) => { state[index] = next; }]; },
  };
  const dependencies = {
    react: React,
    'react-native': { Platform: { OS: platform }, Modal: 'Modal', Pressable: 'Pressable', View: 'View', Text: 'Text', StyleSheet: { create: (value) => value } },
    '@react-native-community/datetimepicker': 'NativePicker',
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
    '../context/AppContext': { useApp: () => ({ theme: { colors: {}, dark: false } }) },
    './AppTextInput': 'AppTextInput',
  };
  const { code } = babel.transformFileSync(path.resolve(__dirname, '../src/components', filename), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => { if (!(id in dependencies)) throw new Error(id); return dependencies[id]; }, Date });
  let tree;
  const render = () => { cursor = 0; tree = exports.default({ value, onChange: (next) => { value = next; changes.push(next); } }); };
  const all = (node) => !node || typeof node !== 'object' ? [] : [node, ...(node.props?.children || []).flat(Infinity).flatMap(all)];
  const find = (predicate) => all(tree).find(predicate);
  render();
  find((node) => node.props?.accessibilityLabel?.startsWith('Open ')).props.onPress();
  render();
  return { changes, render, picker: () => find((node) => node.type === 'NativePicker'), done: () => find((node) => node.props?.accessibilityLabel?.startsWith('Confirm ')).props.onPress() };
}
for (const [filename, mode] of [['TravelDateField.native.js', 'date'], ['VisitTimeField.native.js', 'time']]) {
  test(`Android ${mode} picker opens natively, uses the supported change event, and dismisses without saving`, () => {
    const screen = mount(filename, 'android', mode === 'date' ? '2026-09-08' : '8:00 AM');
    assert.equal(screen.picker().props.mode, mode);
    assert.equal(screen.picker().props.onChange, undefined);
    screen.picker().props.onDismiss();
    screen.render();
    assert.equal(screen.picker(), undefined);
    assert.equal(screen.changes.length, 0);
  });
  test(`iOS ${mode} picker Done commits even when the initial selection was not moved`, () => {
    const screen = mount(filename, 'ios', '');
    screen.done();
    assert.equal(screen.changes.length, 1);
    assert.match(screen.changes[0], mode === 'date' ? /^\d{4}-\d{2}-\d{2}$/ : /^8:00 AM$/);
  });
  test(`Android ${mode} picker saves the chosen value`, () => {
    const screen = mount(filename, 'android', '');
    const selected = new Date(2026, 8, 9, 14, 35);
    screen.picker().props.onValueChange({}, selected);
    assert.equal(screen.changes[0], mode === 'date' ? '2026-09-09' : '2:35 PM');
  });
}
