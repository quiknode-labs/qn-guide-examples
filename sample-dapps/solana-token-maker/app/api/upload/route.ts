import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      var myHeaders = new Headers();
      myHeaders.append("x-api-key", "YOUR_API_KEY");

      var formdata = new FormData();
      formdata.append("Body", req.file, "YOUR_FILE_PATH");
      formdata.append("Key", "YOUR_FILE_NAME");
      formdata.append("ContentType", "YOUR_CONTENT_TYPE");

      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow'
      };

      const response = await fetch("https://api.quicknode.com/ipfs/rest/v1/s3/put-object", requestOptions);
      const result = await response.text();

      res.status(200).json({ result });
    } catch (error) {
      console.log('error', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
