module.exports = function (plop) {
  plop.setGenerator('components', {
    description: 'create a new Page',
    prompts: [
      {
        type: 'list',
        name: 'category',
        message: 'What type of component would you like to create?',
        choices: ['atom', 'molecule', 'organism', 'page'],
      },
      {
        type: 'input',
        name: 'name',
        message:
          'What is the name of your component? Use space in multi-word names.',
        validate: value => {
          if (/.+/.test(value)) {
            return true;
          }
          return 'name is required';
        },
      },
    ],
    actions: data => {
      const actions = [];
      const category = data.category.toLowerCase();
      const pathTemplate =
        category === 'page'
          ? `src/${category}s/{{dashCase name}}/`
          : `src/${category}s/${category}-{{dashCase name}}/${category}-`;

      const componentTemplateType = category === 'page' ? 'page' : 'component';

      if (!data.name) return;

      actions.push(
        {
          type: 'add',
          path: `${pathTemplate}{{dashCase name}}.tsx`,
          templateFile: `plop-templates/${componentTemplateType}.hbs`,
        },
        {
          type: 'add',
          path: `${pathTemplate}{{dashCase name}}.module.scss`,
          templateFile: `plop-templates/style.hbs`,
        },
        {
          type: 'add',
          path: `${pathTemplate}{{dashCase name}}.stories.tsx`,
          templateFile: `plop-templates/story.hbs`,
        },
      );

      return actions;
    },
  });
};
