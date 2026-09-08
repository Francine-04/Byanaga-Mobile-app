const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

function mount() {
  const hooks = [];
  const effects = [];
  const calls = [];
  const navigationEvents = [];
  let cursor = 0;
  let dirty = false;
  let tree;
  let complete;
  let fail;
  const app = {
    firebaseUser: { uid: 'user-1' }, travelerReady: true, backendErrors: {}, isGuestMode: false,
    theme: { colors: {} }, preferences: { places: [], activities: [] },
    profile: { name: 'Old Name', phone: '09171234567', bio: 'Old bio', nationality: 'Filipino', image: 'old-avatar', coverImage: 'old-cover' },
    setProfile: (profile) => { app.profile = profile; },
    setIsGuestMode: (value) => { app.isGuestMode = value; }, setIsLoggedIn: () => {},
  };
  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], (next) => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next; dirty = true; }];
    },
    useRef: (initial) => { const index = cursor++; if (!(index in hooks)) hooks[index] = { current: initial }; return hooks[index]; },
    useEffect: (effect, deps) => {
      const index = cursor++;
      if (!(index in hooks) || deps.some((value, item) => !Object.is(value, hooks[index][item]))) {
        hooks[index] = deps;
        effects.push(effect);
      }
    },
  };
  const mocks = {
    react: React,
    'react-native': { Keyboard: { dismiss: () => {} }, KeyboardAvoidingView: 'KeyboardAvoidingView', Platform: { OS: 'web' }, Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: (styles) => styles } },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    '../../context/AppContext': { useApp: () => app },
    '../../data/nationalities': { nationalityOptions: [] },
    '../../components/AppHeader': { __esModule: true, default: 'AppHeader', goToDashboard: () => navigationEvents.push('Home'), goToMain: (_, tab) => navigationEvents.push(tab) },
    '../../services/profilePhotoService': { saveProfileEdits: (uid, profile, assets) => {
      calls.push({ uid, profile, assets });
      return new Promise((resolve, reject) => { complete = resolve; fail = reject; });
    } },
  };
  for (const component of ['AppButton', 'AppTextInput', 'ProfilePortrait', 'Screen', 'SelectionSheet', 'SettingsRow']) mocks['../../components/' + component] = component;
  const { code } = babel.transformFileSync(path.resolve(__dirname, '../src/screens/profile/EditProfileScreen.js'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'] });
  const exports = {};
  vm.runInNewContext(code, { exports, require: (id) => { if (!(id in mocks)) throw new Error(id); return mocks[id]; } });
  const navigation = { reset: (value) => navigationEvents.push(value), navigate: (value) => navigationEvents.push(value) };
  const render = () => {
    let passes = 0;
    do {
      if (++passes > 10) throw new Error('Render loop');
      dirty = false;
      cursor = 0;
      tree = exports.default({ navigation });
      while (effects.length) effects.shift()();
    } while (dirty);
  };
  const all = (node) => !node || typeof node !== 'object' ? [] : [node, ...(node.props?.children || []).flat(Infinity).flatMap(all)];
  const find = (type, label) => all(tree).find((node) => node.type === type && (!label || node.props.label === label));
  render();
  return { app, calls, navigationEvents, render, find, complete: (value) => complete(value), fail: (error) => fail(error),
    alerts: () => all(tree).filter((node) => node.props.accessibilityRole === 'alert').flatMap((node) => node.props.children) };
}

test('Edit Profile previews photos locally and only saves once when Save Changes is clicked', async () => {
  const screen = mount();
  screen.find('ProfilePortrait').props.onPhotoSelected('image', { uri: 'local://new.png' });
  screen.find('AppTextInput', 'Full Name').props.onChangeText('New Name');
  screen.render();
  assert.equal(screen.calls.length, 0);
  assert.equal(screen.find('ProfilePortrait').props.profile.image, 'local://new.png');
  assert.equal(screen.app.profile.image, 'old-avatar');
  const save = screen.find('AppButton').props.onPress;
  const pending = save();
  await save();
  screen.render();
  assert.equal(screen.calls.length, 1);
  assert.equal(screen.find('AppButton').props.disabled, true);
  assert.equal(screen.find('AppTextInput', 'Full Name').props.editable, false);
  assert.equal(screen.navigationEvents.length, 0);
  screen.complete({ ...screen.calls[0].profile, image: 'https://example.com/saved.png' });
  await pending;
  assert.equal(screen.app.profile.name, 'New Name');
  assert.equal(screen.app.profile.image, 'https://example.com/saved.png');
  assert.deepEqual(screen.navigationEvents, ['Profile']);
});

test('failed saves retain all local edits and enable Save Changes for retry', async () => {
  const screen = mount();
  screen.find('AppTextInput', 'Bio').props.onChangeText('New bio');
  screen.find('ProfilePortrait').props.onPhotoSelected('coverImage', { uri: 'local://cover.png' });
  screen.render();
  const pending = screen.find('AppButton').props.onPress();
  screen.fail(new Error('Database permission denied'));
  await pending;
  screen.render();
  assert.equal(screen.find('AppButton').props.disabled, false);
  assert.equal(screen.find('AppTextInput', 'Bio').props.value, 'New bio');
  assert.equal(screen.find('ProfilePortrait').props.profile.coverImage, 'local://cover.png');
  assert.equal(screen.app.profile.bio, 'Old bio');
  assert.equal(screen.navigationEvents.length, 0);
  assert.ok(screen.alerts().includes('Database permission denied'));
});

test('incoming profile data refreshes untouched fields without discarding unsaved edits', async () => {
  const screen = mount();
  screen.app.travelerReady = false;
  screen.find('AppTextInput', 'Bio').props.onChangeText('Unsaved bio');
  screen.app.profile = { ...screen.app.profile, name: 'Restored Name', image: 'saved-avatar', coverImage: 'saved-cover' };
  screen.render();
  assert.equal(screen.find('AppTextInput', 'Bio').props.value, 'Unsaved bio');
  assert.equal(screen.find('AppTextInput', 'Full Name').props.value, 'Restored Name');
  assert.equal(screen.find('ProfilePortrait').props.profile.image, 'saved-avatar');
  await screen.find('AppButton').props.onPress();
  assert.equal(screen.calls.length, 0, 'must wait for the backend profile before saving');
});

test('guests cannot save Edit Profile and are sent to Login', async () => {
  const screen = mount();
  screen.app.isGuestMode = true;
  screen.app.firebaseUser = null;
  screen.render();
  await screen.find('AppButton').props.onPress();
  assert.equal(screen.calls.length, 0);
  assert.equal(screen.navigationEvents[0].routes[0].params.screen, 'Login');
});
