# Deploy a Clarity Smart Contract on Stacks

This project is based on the guide, [How to Create and Deploy a Clarity Smart Contract on the Stacks Blockchain](https://www.quicknode.com/guides/web3-sdks/how-to-create-and-deploy-a-clarity-smart-contract-on-the-stacks-blockchain) by Ferhat Kochan.

## Clone Example Monorepo

To begin, clone the `qn-guide-examples` repo and navigate to this project's directory.

```bash
git clone https://github.com/quiknode-labs/qn-guide-examples.git
cd qn-guide-examples/stacks/stacks-smart-contract
```

## Install Clarinet

Make sure you have [Clarinet](https://github.com/hirosystems/clarinet) installed in order to run the following commands.

## Initialize Clarinet Console

```bash
clarinet console
```

Once the console is initialized, run the `get-storage` function to return the initial value.

```bash
(contract-call? .storage-contract get-storage)
```

This will output `u"initial value"`. Use the `set-storage` function to change the value

```bash
(contract-call? .storage-contract set-storage u"new value")
```

This will output `(ok true)`. To verify the value was changed, run `get-storage` again to see if it outputs `u"new value"`:

```bash
(contract-call? .storage-contract get-storage)
```