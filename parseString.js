BigInt.prototype.pow = function(n){
	return this**BigInt(n);
}

function toUnicode(int){
	let name = "";
	for(let i = int; i >= 1n; i = i/(0xFFFFn+1n)) {
		i--; name += String.fromCharCode((i % (0xFFFFn+1n)).toString());
	} return name.split('').reverse().join('');
}

function parseUnicode(name) {
	let int = 0n; name = name.split('').reverse().join('');
	for(let i = 0n; i < name.length; i++) {
		int += BigInt(name.charCodeAt(i.toString()) + 1) * (0xFFFFn+1n).pow(i);
	} return int;
}