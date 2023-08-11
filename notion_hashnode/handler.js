'use strict';
require('dotenv').config();
const { Client } = require('@notionhq/client');
const axios = require('axios');
const { createDevToBlog, convertBlockToMarkdown, createDevToBlogPublished } = require('./index.js');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DEV_TO_API_KEY = process.env.DEV_TO_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: NOTION_API_KEY });

module.exports.notion_to_devto_update = async (event) => {
  const databaseId = NOTION_DATABASE_ID;
  try{
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status', // Replace with the actual property name for status
        status: {
          equals: 'Published', // Replace with the value that represents "done" status
        },
      },
    });

    const formattedResponse = [];

    for (const item of response.results) {
      
      if(item.url){
      const linkedPageId = item.url.slice(-32);

      const linkedPageResponse = await notion.blocks.children.list({
        block_id: linkedPageId,
      });

      const contentMarkdown = linkedPageResponse.results.map(block => convertBlockToMarkdown(block)).join('\n');

      formattedResponse.push({
        title: item.properties['Title'].title[0].plain_text,
        coverImageUrl: item.properties['Cover Image URL'].url,
        tags: item.properties['Tags'].multi_select.map(tag => tag.name),
        content: contentMarkdown,
        id: item.properties['ID'].number,
      });
    }
}
        for (const item of formattedResponse) {
          await createDevToBlogPublished(item);
        }
        return {
          statusCode: 200,
          body: JSON.stringify(
            {
              message: 'Successfully updated blogs',
              content:formattedResponse,
              input: event,
            },
            null,
            2
          ),
        };
  } catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify(
      {
        message: 'Error querying Notion database!',
        error: error.message,
        input: event,
      },
      null,
      2
    ),
  };
}
}

module.exports.notion_to_blog = async (event) => {
  const  databaseId = NOTION_DATABASE_ID;
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Status', // Replace with the actual property name for status
        status: {
          equals: 'done', // Replace with the value that represents "done" status
        },
      },
    });

    const formattedResponse = [];

    for (const item of response.results) {
      
      if(item.url){
      const linkedPageId = item.url.slice(-32);

      const linkedPageResponse = await notion.blocks.children.list({
        block_id: linkedPageId,
      });

      const contentMarkdown = linkedPageResponse.results.map(block => convertBlockToMarkdown(block)).join('\n')

          formattedResponse.push({
            title: item.properties['Title'].title[0].plain_text,
            coverImageUrl: item.properties['Cover Image URL'].url,
            tags: item.properties['Tags'].multi_select.map(tag => tag.name),
            content: contentMarkdown
          });
        }
    }

    for (const item of formattedResponse) {
      const published_response = await createDevToBlog(item);

      const response_1 = await notion.pages.update({
        page_id: item.id,
        properties: {
          'Status' : {
            status: {
              name: 'Published'
            }
          },
          'ID': {
            number: published_response.id
          }
        }
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: 'Successfully published blogs to DevTo.',
          content:formattedResponse,
          input: event,
        },
        null,
        2
      ),
    };
  } catch (error) {
  return {
    statusCode: 500,
    body: JSON.stringify(
      {
        message: 'Error querying Notion database!',
        error: error.message,
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
  }
};