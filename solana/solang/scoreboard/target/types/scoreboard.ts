export type Scoreboard = {
  "version": "0.3.1",
  "name": "scoreboard",
  "instructions": [
    {
      "name": "new",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "isOptional": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [
        {
          "name": "payer",
          "type": "bytes"
        },
        {
          "name": "bump",
          "type": {
            "array": [
              "u8",
              1
            ]
          }
        },
        {
          "name": "player",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addPoints",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [
        {
          "name": "numpoints",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resetScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": []
    },
    {
      "name": "getCurrentScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "getHighScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "metadata": {
    "address": "F1ipperKF9EfD821ZbbYjS319LXYiBmjhzkkf5a26rC"
  }
};

export const IDL: Scoreboard = {
  "version": "0.3.1",
  "name": "scoreboard",
  "instructions": [
    {
      "name": "new",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "isOptional": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [
        {
          "name": "payer",
          "type": "bytes"
        },
        {
          "name": "bump",
          "type": {
            "array": [
              "u8",
              1
            ]
          }
        },
        {
          "name": "player",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "addPoints",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [
        {
          "name": "numpoints",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resetScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": true,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": []
    },
    {
      "name": "getCurrentScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [],
      "returns": "u64"
    },
    {
      "name": "getHighScore",
      "accounts": [
        {
          "name": "dataAccount",
          "isMut": false,
          "isSigner": false,
          "isOptional": false
        }
      ],
      "args": [],
      "returns": "u64"
    }
  ],
  "metadata": {
    "address": "F1ipperKF9EfD821ZbbYjS319LXYiBmjhzkkf5a26rC"
  }
};
