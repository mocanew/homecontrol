import React from 'react';
import { storiesOf, action } from '@kadira/storybook';
import Input from '../input.jsx';

storiesOf('Input', module)
  .add('with child', () => (
    <Input onChange={action('change')}>My First Button</Input>
  ))
  .add('with no child', () => (
    <Input/>
  ));