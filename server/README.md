## HTTP Server Configuration

- **Port**: 3001
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Enabled for http://localhost:3000

## API Routes

### 1. Bridge Transfer

Execute a cross-chain USDC bridge transfer.

**Endpoint**: `POST /api/bridge`

**Request Body**:

```json
{
  "sourceUserAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "sourceChainId": 1,
  "destinationUserAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  "destinationChainId": 137,
  "amount": 100.5
}
```

**Request Fields**:

- `sourceUserAddress` (string, required): Valid blockchain address of the source user
- `sourceChainId` (number, required): Positive integer representing source chain ID
- `destinationUserAddress` (string, required): Valid blockchain address of the destination user
- `destinationChainId` (number, required): Positive integer representing destination chain ID (must differ from source)
- `amount` (number, required): Positive number representing amount to bridge

**Success Response** (200):

```json
{
  "status": "success",
  "message": "Transfer completed successfully. Source transaction: https://etherscan.io/tx/0x... - Destination transaction: https://polygonscan.com/tx/0x... - Amount bridged: 100500000"
}
```

**Error Response** (400):

```json
{
  "status": "error",
  "message": "Insufficient allowance"
}
```

**Error Response** (500):

```json
{
  "status": "error",
  "message": "Source user to source pool transaction failed"
}
```

**Validation Rules**:

- All addresses must be valid blockchain addresses (checksummed)
- Chain IDs must be positive numbers
- Source and destination chain IDs must be different
- Amount must be positive

**Bridge Process**:

1. Validates bridge requirements (allowance, pool balance, decimals)
2. Checks gas requirements on both chains
3. Executes source transfer (transferFrom user to pool)
4. Executes destination transfer (transfer from pool to destination user)
5. Records transaction in bridging logs
6. Reverts source transfer if destination transfer fails

**Possible Error Messages**:

- "Source and destination chains must be different"
- "Source and destination decimals must be the same"
- "Insufficient allowance"
- "Insufficient destination pool balance"
- "Insufficient native token balance to pay for gas on source chain"
- "Insufficient native token balance to pay for gas on destination chain"
- "Source user to source pool transaction failed"
- "Destination pool to destination user transaction failed"
- "Revert source pool to source user transaction failed"
- "Bridge operation already in progress for this request"

---

### 2. Get Bridging Logs

Retrieve bridging logs for specific user addresses.

**Endpoint**: `GET /api/logs`

**Query Parameters**:

- `sourceUserAddress` (string, required): Valid blockchain address of the source user
- `destinationUserAddress` (string, required): Valid blockchain address of the destination user
- `limit` (number, optional): Number of records to return (1-100, default: 10)
- `offset` (number, optional): Number of records to skip (minimum: 0, default: 0)

**Example Request**:

```
GET /api/logs?sourceUserAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&destinationUserAddress=0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199&limit=20&offset=0
```

**Success Response** (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "sourceTxHash": "0xabc123...",
      "sourceTxExplorerUrl": "https://etherscan.io/tx/0xabc123...",
      "sourceUserAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "destinationTxHash": "0xdef456...",
      "destinationTxExplorerUrl": "https://polygonscan.com/tx/0xdef456...",
      "destinationUserAddress": "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
      "amountBridged": "100500000",
      "createdAt": "2025-11-18T10:00:00.000Z"
    }
  ]
}
```

**Error Response** (400):

```json
{
  "status": "error",
  "message": "Source user address must be a valid blockchain address"
}
```

**Error Response** (500):

```json
{
  "status": "error",
  "message": "Database connection failed"
}
```

**Validation Rules**:

- Both addresses must be valid blockchain addresses
- Limit must be between 1 and 100
- Offset must be greater than or equal to 0

---

### 3. Get USDC Address

Retrieve the USDC contract address for a specific chain.

**Endpoint**: `GET /api/usdcAddress`

**Query Parameters**:

- `chainId` (number, required): Positive integer representing the chain ID

**Example Request**:

```
GET /api/usdcAddress?chainId=1
```

**Success Response** (200):

```json
{
  "status": "success",
  "data": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
}
```

**Error Response** (500):

```json
{
  "status": "error",
  "message": "USDC address not configured for chain 999"
}
```

**Validation Rules**:

- Chain ID must be a positive integer

---

## Development

### Installation

```bash
npm install
```

### Running the Server

```bash
npm run dev
```

The server will start on http://localhost:3001

### Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
BASE_TESTNET_PRIVATE_KEY=
FLOW_TESTNET_PRIVATE_KEY=
MYSQL_CONNECTION_URL=
BASE_TESTNET_RPC_URL=
FLOW_TESTNET_RPC_URL=
BASE_TESTNET_EXPLORER_URL=
FLOW_TESTNET_EXPLORER_URL=

# Add more RPC URLs as needed
```

### Type Generation

Generate TypeChain types for ERC20 ABI:

```bash
npm run typechain
```
