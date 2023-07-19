import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import OrganismR3fDrei from './organism-r3f-drei';

export default {
  title: 'Organisms/R3fDrei',
  argTypes: {
    isDarkMode: { control: 'boolean' },
  },
} as Meta;

const Template: StoryFn = ({ darkMode }) => (
  <div className={darkMode ? 'is-dark-mode' : 'is-light-mode'}>
    <OrganismR3fDrei />
  </div>
);

export const Default = Template.bind({});
Default.args = {
  isDarkMode: false,
};