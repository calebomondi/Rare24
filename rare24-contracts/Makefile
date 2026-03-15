-include .env

.PHONY: all test clean deploy fund help install snapshot format size

all: clean remove install update build

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install :; forge install 

# Update Dependencies
update:; forge update

build:; forge build

test :; forge test 

size:; forge build --sizes

snapshot :; forge snapshot

format :; forge fmt

NETWORK_ARGS := --rpc-url $(PASEO_RPC_URL) --private-key $(PRIVATE_KEY) --broadcast

ifeq ($(findstring --network paseo,$(ARGS)),--network paseo)
	NETWORK_ARGS := --chain 420420417 \
					--rpc-url $(PASEO_RPC_URL) \
					--private-key $(PRIVATE_KEY) \
					--broadcast \
					--slow	\
					--verifier-url https://blockscout-testnet.polkadot.io/api? \
					--verifier blockscout
endif

estimate: 
	@forge script script/DeployRare24.s.sol:DeployRare24 --rpc-url $(PASEO_RPC_URL) -vvvv

deploy:
	@forge script script/DeployRare24.s.sol:DeployRare24 $(NETWORK_ARGS)

verify:
	@forge verify-contract \
	--rpc-url https://blockscout-testnet.polkadot.io/api/eth-rpc \
	--verifier blockscout \
	--verifier-url 'https://blockscout-testnet.polkadot.io/api/' \
	$(contract_deployed_address) \
	$(contractFile):$(contractName)

deploy-market:
	@forge script script/DeployMarketplace.s.sol:DeployMarketplace $(NETWORK_ARGS)

mint:
	@forge script script/Interactions.s.sol:MintBasicNft ${NETWORK_ARGS}
