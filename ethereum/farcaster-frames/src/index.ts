import express from 'express';
import cors from 'cors';
import { IFrameProps } from './types'
import { getBorrowPower, getUserfromfId, getWalletTokenBalances } from "./utils/ethers";
import { frameGenerator } from './utils/frame';
import 'dotenv/config'

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*'
}));

const port = 8080;
const NGROK_URL = process.env.NGROK_URL

app.get('/frame', (req, res) => {
    const frameProps: IFrameProps = {
        imageUrl: 'https://placehold.co/750x750/grey/white.png?text=Calculate Borrow Power',
        buttons: ['Calculate Borrowing Power', 'Source Code'],
        postUrl: NGROK_URL + req.url,
        action: 'link',
        target: 'https://www.quicknode.com/guides/social/how-to-build-a-farcaster-frame'
    };

    res.status(200).send(frameGenerator(frameProps));
});

app.post('/frame', async (req, res) => {
    let borrowImage;
    try {
        const { fid } = req.body.untrustedData;
        if (!fid) {
            return res.status(400).json({ error: 'FID is required in the request body.' });
        }

        const userData = await getUserfromfId(fid);
        if (!userData) {
            return res.status(400).json({ error: 'User data not found.' });
        }

        if (userData != "0x0") {
            const tokenBalances = await getWalletTokenBalances(userData);
            let borrowPower;
            try {
                borrowPower = await getBorrowPower(tokenBalances);
                borrowImage = `https://placehold.co/750x750/grey/white.png?text=Total+BP=$${borrowPower.toLocaleString()}`;
            } catch (error) {
                console.error('Error calculating borrow power:', error);
                return res.status(400).json({ error: 'Error calculating borrow power.' });
            }
        } else {
            borrowImage = `https://placehold.co/500x500/grey/white.png?text=Wallet Address or Token Balances Not Found`;
        }

        const frameProps: IFrameProps = {
            imageUrl: borrowImage,
            buttons: ['Recalculate Borrowing Power', 'Source Code'],
            postUrl: NGROK_URL + req.url,
            action: 'link',
            target: 'https://www.quicknode.com/guides/social/how-to-build-a-farcaster-frame'
        };

        res.status(200).send(frameGenerator(frameProps));
    } catch (error) {
        console.error('Error handling request:', error);
        return res.status(400).json({ error: 'Invalid request.' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
