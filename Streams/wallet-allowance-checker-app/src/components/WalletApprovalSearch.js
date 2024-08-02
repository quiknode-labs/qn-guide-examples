import React, { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { 
  TextField, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Modal, 
  Box, Typography, Container, CircularProgress
} from '@mui/material';

const WalletApprovalSearch = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [approvalData, setApprovalData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setApprovalData(null);
    setHistoryData(null);

    try {
      const response = await axios.get(`http://localhost:3001/api/wallet-approval-states/${walletAddress}`);
      const { latest_approvals, approval_history } = response.data;

      if (latest_approvals) {
        const processedApprovals = await processApprovals(latest_approvals);
        setApprovalData(processedApprovals);
      }

      if (approval_history) {
        const historyObject = typeof approval_history === 'string' 
          ? JSON.parse(approval_history) 
          : approval_history;
        const processedHistory = await processApprovals(historyObject);
        setHistoryData(processedHistory);
      }

      if (!latest_approvals && !approval_history) {
        setError('No approval data found for this wallet address.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data. Please try again. ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const processApprovals = async (approvals) => {
    const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_QUICKNODE_ENDPOINT);
    
    return Promise.all(Object.entries(approvals).map(async ([key, approval]) => {
      const tokenContract = new ethers.Contract(approval.token, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ], provider);

      try {
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name().catch(() => 'Unknown'),
          tokenContract.symbol().catch(() => 'UNK'),
          tokenContract.decimals().catch(() => 18),
        ]);

        const normalizedAmount = ethers.formatUnits(approval.amount, decimals);

        return {
          ...approval,
          tokenName: name,
          tokenSymbol: symbol,
          normalizedAmount,
        };
      } catch (error) {
        console.warn(`Error processing token ${approval.token}:`, error);
        return {
          ...approval,
          tokenName: 'Unknown',
          tokenSymbol: 'UNK',
          normalizedAmount: ethers.formatUnits(approval.amount, 18), // assume 18 decimals
        };
      }
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Wallet Approval Search
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Wallet Address"
            variant="outlined"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
          <Button variant="contained" onClick={handleSearch} disabled={isLoading}>
            {isLoading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && approvalData && approvalData.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Latest Approvals
            </Typography>
            {approvalData.some(approval => approval.tokenName === 'Unknown') && (
              <Typography color="warning" sx={{ mb: 2 }}>
                Warning: Some token information could not be retrieved. These tokens are marked as 'Unknown'.
              </Typography>
            )}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token Name</TableCell>
                    <TableCell>Token Symbol</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Spender</TableCell>
                    <TableCell>Block Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvalData.map((approval, index) => (
                    <TableRow key={index}>
                      <TableCell>{approval.tokenName}</TableCell>
                      <TableCell>{approval.tokenSymbol}</TableCell>
                      <TableCell>{approval.normalizedAmount}</TableCell>
                      <TableCell>{approval.spender}</TableCell>
                      <TableCell>{approval.blockNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {historyData && historyData.length > 0 && (
              <Button onClick={() => setIsHistoryModalOpen(true)} sx={{ mt: 2 }}>
                View History
              </Button>
            )}
          </>
        )}

        {!isLoading && approvalData !== null && approvalData.length === 0 && (
          <Typography>No records found</Typography>
        )}

        <Modal
          open={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 800,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <Typography variant="h6" gutterBottom>Approval History</Typography>
            {historyData && historyData.some(approval => approval.tokenName === 'Unknown') && (
              <Typography color="warning" sx={{ mb: 2 }}>
                Warning: Some historical token information could not be retrieved. These tokens are marked as 'Unknown'.
              </Typography>
            )}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token Name</TableCell>
                    <TableCell>Token Symbol</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Spender</TableCell>
                    <TableCell>Block Number</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyData && historyData.map((approval, index) => (
                    <TableRow key={index}>
                      <TableCell>{approval.tokenName}</TableCell>
                      <TableCell>{approval.tokenSymbol}</TableCell>
                      <TableCell>{approval.normalizedAmount}</TableCell>
                      <TableCell>{approval.spender}</TableCell>
                      <TableCell>{approval.blockNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button onClick={() => setIsHistoryModalOpen(false)} sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        </Modal>
      </Box>
    </Container>
  );
};

export default WalletApprovalSearch;