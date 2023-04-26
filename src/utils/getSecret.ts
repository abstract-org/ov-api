import * as AWS from 'aws-sdk';

export const getSecret = async (secretName: string): Promise<string> => {
  const region = process.env.AWS_REGION;
  const client = new AWS.SecretsManager({ region });

  try {
    const data = await client
      .getSecretValue({ SecretId: secretName })
      .promise();
    if (data.SecretString) {
      return JSON.parse(data.SecretString)[secretName];
    }
    return null;
  } catch (err) {
    console.error(`Error retrieving secret ${secretName}:`, err);
    throw err;
  }
};
