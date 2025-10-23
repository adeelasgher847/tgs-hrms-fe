import React, { useState } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { validateToken } from '../utils/authValidation';

/**
 * Test component to verify token validation
 * This can be removed after testing
 */
export const TokenValidationTest: React.FC = () => {
  const [validationResult, setValidationResult] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);

  const testTokenValidation = async () => {
    setIsValidating(true);
    setValidationResult('Validating token...');
    
    
    try {
      const result = await validateToken();
      if (result.isValid) {
        setValidationResult(`✅ Token is valid. User: ${JSON.stringify(result.user, null, 2)}`);
      } else {
        setValidationResult(`❌ Token is invalid. Error: ${result.error}`);
      }
    } catch (error: unknown) {
      setValidationResult(`❌ Validation failed: ${(error as Error).message}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #ccc', borderRadius: 1, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Token Validation Test
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testTokenValidation}
        disabled={isValidating}
        sx={{ mb: 2 }}
      >
        {isValidating ? 'Validating...' : 'Test Token Validation'}
      </Button>
      
      {validationResult && (
        <Alert severity={validationResult.includes('✅') ? 'success' : 'error'}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {validationResult}
          </pre>
        </Alert>
      )}
    </Box>
  );
};

export default TokenValidationTest;
