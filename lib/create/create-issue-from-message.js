const axios = require('axios');
const IssueCreated = require('../messages/create/create-issue-attachment');
const dialogs = require('../dialogs');
const { Subscription } = require('../models');

async function openDialog(req, res) {
  const { slackWorkspace } = res.locals;
  console.log('slackWorkspace', slackWorkspace);
  const {
    trigger_id, team, channel, message,
  } = req.body;

  await slackWorkspace.userClient.dialog.open({
    dialog: dialogs.createIssue(message, channel, team),
    trigger_id,
  });

  return res.send();
}

async function getUserRepos(req, res) {
  const { slackUser } = res.locals;
  const { channel } = req.body;

  const query = `
      query {
        viewer {
          repositories(first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
            totalCount
            nodes {
              id
              databaseId
              isPrivate
              name
              owner {
                id
              }
              description
            }
          }
        }
      }`;

  const { data } = await slackUser.GitHubUser.client.request({
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: '/graphql',
    query,
  });

  const { repositories } = data.data.viewer;

  const inChannel = [];
  const notInChannel = [];

  const sortIntoChannel = repo =>
    new Promise((resolve, reject) => {
      try {
        Subscription.lookup(repo.databaseId).then((sub) => {
          console.log('sub', sub);
          if (!sub) {
            notInChannel.push(repo);
            return resolve(repo);
          }

          if (sub && sub.length < 1) {
            notInChannel.push(repo);
            return resolve(repo);
          }

          if (sub && sub[0].dataValues) {
            if (sub[0].dataValues.channelId === channel.id) {
              inChannel.push(repo);
              return resolve(repo);
            }

            inChannel.push(repo);
            return resolve(repo);
          }
          notInChannel.push(repo);
          return resolve(repo);
        });
      } catch (error) {
        reject(error);
      }
    });

  const promises = repositories.nodes;
  console.log('promises', promises);

  Promise.all(promises)
    .then(() => {
      console.log('-->', promises);
      res.send({
        option_groups: [
          {
            label: 'Other Repos',
            options: promises.map(repo => ({
              label: repo.name,
              value: repo.databaseId,
            })),
          },
        ],
      });
    })
    .catch(error =>
      res.send({
        errors: [
          {
            name: 'repository',
            error: 'Something went wrong',
          },
        ],
      }));
}

async function createIssueFromDialog(req, res) {
  const { slackUser } = res.locals;

  const { title, body, repository } = req.body.submission;
  const { response_url } = req.body;
  let repos;
  try {
    repos = await slackUser.GitHubUser.client.repos.getById({ id: repository });
  } catch (e) {
    const errorMessage = JSON.parse(e.message).message;
    return res.send({
      errors: [
        {
          name: 'repository',
          error: errorMessage,
        },
      ],
    });
  }

  const owner = repos.data.owner.login;
  const repo = repos.data.name;
  let createdIssue;
  try {
    createdIssue = await slackUser.GitHubUser.client.issues.create({
      owner,
      repo,
      title,
      body,
    });
  } catch (e) {
    const errorMessage = JSON.parse(e.message).message;
    return res.send({
      errors: [
        {
          name: 'repository',
          error: errorMessage,
        },
      ],
    });
  }

  await axios.post(response_url, {
    response_type: 'ephemeral',
    attachments: IssueCreated(createdIssue),
  });

  return res.send();
}

module.exports = {
  openDialog,
  getUserRepos,
  createIssueFromDialog,
};
