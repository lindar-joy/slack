module.exports = (message, channel, team) => {
  const linkToMessage = channel && `https://${team.domain}.slack.com/archives/${
    channel.id
  }/p${message.ts.replace('.', '')}`;

  const comment = message && `> ${message.text}\n<sub>[View message in Slack](${linkToMessage})</sub>`;

  return {
    callback_id: 'create-issue',
    title: 'Open new issue',
    submit_label: 'Open',
    elements: [
      {
        label: 'Repository',
        type: 'select',
        name: 'repository',
        data_source: 'external',
      },
      {
        type: 'text',
        label: 'Title',
        name: 'title',
      },
      {
        type: 'textarea',
        label: 'Description',
        value: comment,
        name: 'body',
        placeholder: 'Provide a more detailed introduction to the issue itself, and why you consider it to be a bug',
        hint: 'GitHub markdown syntax is supported, although you cannot preview it in Slack.',
      },
      {
        type: 'textarea',
        label: 'Expected Behavior',
        name: 'expected',
        placeholder: 'Tell us what should happen',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Actual Behavior',
        name: 'actual',
        placeholder: 'Tell us what happens instead',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Possible Fix',
        name: 'fix',
        placeholder: 'Not obligatory, but suggest a fix or reason for the bug',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Steps to Reproduce',
        name: 'steps',
        placeholder: 'Provide a link to a live example, or an unambiguous set of steps to reproduce this bug. Include code to reproduce, if relevant',
        value: '1. 2. 3. 4.',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Context',
        name: 'context',
        placeholder: 'How has this bug affected you? What were you trying to accomplish?',
        optional: true,
      },
      {
        type: 'textarea',
        label: 'Your Environment',
        name: 'environment',
        placeholder: 'Tell us what should happen',
        value: `
- Version used:
- Browser Name and version:
- Operating System and version (desktop or mobile):
- Link to your project:`,
        hint: 'Include as many relevant details about the environment you experienced the bug in',
        optional: true,
      },
    ],
  };
};
