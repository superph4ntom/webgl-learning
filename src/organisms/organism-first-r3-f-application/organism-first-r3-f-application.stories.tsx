import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import OrganismFirstR3FApplication from './organism-first-r3-f-application';

export default {
  title: 'Organisms/FirstR3FApplication',
  argTypes: {
    isDarkMode: { control: 'boolean' },
  },
} as Meta;

const Template: StoryFn = ({ darkMode }) => (
  <div className={darkMode ? 'is-dark-mode' : 'is-light-mode'}>
    <OrganismFirstR3FApplication />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  isDarkMode: false,
};