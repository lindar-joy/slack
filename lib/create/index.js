const commentAction = require('./comment-action');
const issue = require('./issue');
const deployment = require('./deployment');
const { GitHubUser } = require('../models');

const createIssueDialog = require('../messages/create/create-issue-dialog');
const attachToIssueFromMessage = require('./attach-to-issue-from-message');
const createIssueFromMessage = require('./create-issue-from-message');

// TODO: Move the two functions in here into a separat modeule
async function openDialog(req, res) {
  const {
    command, gitHubUser, slackWorkspace, resource,
  } = res.locals;

  const { owner, repo } = resource;
  const repository = (await gitHubUser.client.repos.get({ owner, repo })).data;

  const { trigger_id } = req.body;
  await slackWorkspace.client.dialog.open({
    dialog: createIssueDialog(repository),
    trigger_id,
  });

  return command.respond();
}

async function dialogSubmit(req, res) {
  const { slackUser } = res.locals;

  const { title, body } = req.body.submission;
  const { repository } = req.body.submission;

  await slackUser.reload({ include: [GitHubUser] });
  const { data } = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  const owner = data.owner.login;
  const repo = data.name;
  await slackUser.GitHubUser.client.issues.create({
    owner,
    repo,
    title,
    body,
  });

  return res.send();
}

module.exports = {
  issue,
  commentAction,
  deployment,
  openDialog,
  dialogSubmit,
  attachToIssueFromMessage,
  createIssueFromMessage,
};
