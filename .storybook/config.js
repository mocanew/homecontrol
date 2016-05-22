import { configure } from '@kadira/storybook';

function loadStories() {
  require('../www/components/stories/input');
  // require as many stories as you need.
}

configure(loadStories, module);