const solc = require("solc");
const fs = require("fs");

const erc20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _initialSupply * 10**uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

const erc721Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleNFT {
    string public name;
    string public symbol;
    uint256 private _tokenIdCounter;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => string) private _tokenURIs;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f || // ERC-721Metadata
            interfaceId == 0x01ffc9a7;   // ERC-165
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);
        require(msg.sender == owner || _operatorApprovals[owner][msg.sender], "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view returns (address) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Self approval");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(ownerOf(tokenId) == from, "Not owner");
        require(to != address(0), "Zero address");
        require(
            msg.sender == from ||
            _tokenApprovals[tokenId] == msg.sender ||
            _operatorApprovals[from][msg.sender],
            "Not authorized"
        );
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        delete _tokenApprovals[tokenId];
        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory) public {
        transferFrom(from, to, tokenId);
    }

    function mint(address to, string memory uri) public returns (uint256) {
        require(to != address(0), "Zero address");
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        _tokenURIs[tokenId] = uri;
        emit Transfer(address(0), to, tokenId);
        return tokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
`;

function compile(source, contractName) {
  const input = {
    language: "Solidity",
    sources: { [`${contractName}.sol`]: { content: source } },
    settings: {
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode.object"] },
      },
    },
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    if (errors.length > 0) {
      console.error("Compilation errors:", errors);
      process.exit(1);
    }
  }
  const contract = output.contracts[`${contractName}.sol`][contractName];
  return {
    abi: contract.abi,
    bytecode: "0x" + contract.evm.bytecode.object,
  };
}

const erc20 = compile(erc20Source, "SimpleToken");
const erc721 = compile(erc721Source, "SimpleNFT");

fs.writeFileSync("lib/erc20-compiled.json", JSON.stringify(erc20, null, 2));
fs.writeFileSync("lib/erc721-compiled.json", JSON.stringify(erc721, null, 2));

console.log("ERC-20 compiled! Bytecode length:", erc20.bytecode.length);
console.log("ERC-721 compiled! Bytecode length:", erc721.bytecode.length);