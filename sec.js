BigInt.prototype.pow = function(n){return this**BigInt(n);}
BigInt.prototype.mod = function(n){return this%BigInt(n);}

BigInt.prototype.sqrt = function(){
	if (this < 0n)  throw 'square root of negative numbers is not supported';
	if (this < 2n)  return this;
	function newtonIteration(n, x0) {
		const x1 = ((n / x0) + x0) >> 1n;
		if (x0 === x1 || x0 === (x1 - 1n)) return x0;
		return newtonIteration(n, x1);
	} return newtonIteration(this, 1n);
}


BigInt.prototype.inverseMod = function(m) {
	let a = BigInt(this);
	let b = BigInt(m);
	let x = 1n;
	let y = 0n;
	while(b){
		[x, y] = [y, x - (a / b) * y];
		[a, b] = [b, a % b];
	}
	return x;
}

BigInt.prototype.gcd = function(n){
	let a = BigInt(this);
	let b = BigInt(n);
	while(b){[a, b] = [b, a%b]}
	return a;
}

BigInt.prototype.isPrime = function(){
	for(let i = 2n, s = (this.sqrt()); i <= s; i++)
        if(this % i === 0) return false; 
    return this > 1n;
}

// is a relatively prime to b
BigInt.prototype.isRelativelyPrime = function(b){
	return this.gcd(b) === 1n;
}

class secure {
	#privateKey = [];
	publicKey = [];
	constructor(security = 3){
		for(let i = 0; i < security; i++){
			let [e, n, d] = this.#setup();
			console.log(`Key ${i+1}/${security} generated!`);
		};
	}

	toUnicode(int){let a="";for(let i=int;i>=1n;i=i/(0xFFFFn+1n)){i--;a+=String.fromCharCode((i%(0xFFFFn+1n)).toString());}return a.split('').reverse().join('');}
	
	parseUnicode(name) {
		let int = 0n; name = name.split('').reverse().join('');
		for(let i = 0n; i < name.length; i++) {
			int += BigInt(name.charCodeAt(i.toString()) + 1) * (0xFFFFn+1n).pow(i);
		} return int;
	}

	randomPrime(bits = 0xF){
		let n = BigInt(Math.floor(Math.random()*(1<<bits)));
		while(!n.isPrime()) n = n+1n;
		return n;
	}

	randomRelativelyPrime(n, bits = 0xF){
		let m = BigInt(Math.floor(Math.random()*(1<<bits)));
		while(!m.isRelativelyPrime(n)) m = m+1n;
		return m;
	}
	
	compress(string, rate = 100, t = 3){
		function run(string, rate) {
			let search_algrtm = []; let str = string;
			let rater = Math.ceil(((1-((rate/100)))**2)*str.length);
			let min = 3; let max = 20;
			for(let i = min; i <= max; i++){
				for(let j = 0; j < str.length; j++){
					let val = str.substring(j, i+j);
					if(val.length <= min) continue;
					search_algrtm.push(val);
					j+=rater;
				}
			}
	
			let score = []; let listmsg = [];
			for(let message of search_algrtm){
				str = string;
				let count = 0;
				while(str.indexOf(message) != -1){
					str = str.replace(message, "");
					count++;
				}
				score.push({message: message, score: count});
			}
	
			// filter out the message from highest score to lowest score
			score.sort((a, b) => b.score - a.score);
			for(let i of score){
				listmsg.push(i.message);
			}
	
			score = [];
	
			str = string;
			for(let message of listmsg){
				let count = 0;
				while(str.indexOf(message) != -1){
					str = str.replace(message, "");
					count++;
				}
				score.push({message: message, score: count});
			}
	
			score.sort((a, b) => b.score - a.score);
	
			// filter if the score less than 2 then remove it
			let new_score = [];
			for(let i of score){
				if(i.score < 2) continue;
				new_score.push(i);
			}
	
			// create header `${length of score}${initial message}${length of message}${message}...`
			let header = `${String.fromCharCode(new_score.length)}`; str = string;
			for(let i of new_score){
				// check unused character and add to header as initial message
				let initial = "";
				char :for(let j = 0; j < 65536; j++){
					if(`${str}${header}`.indexOf(String.fromCharCode(j)) == -1){
						initial = String.fromCharCode(j);
						break char;
					}
				}
				header += initial;
				header += `${String.fromCharCode(i.message.length)}`;
				header += i.message;
				// replace all message with initial message
				str = str.replaceAll(i.message, initial);
			}
			return header+str;
		}
	
		function bestT(string, rate) {
			t = 0;
			let str = string; let bestlen = Infinity; let len = Buffer.byteLength(str);
			while(len <= bestlen){
				str = run(str, rate);
				len = Buffer.byteLength(str); t++;
				if(len <= bestlen){
					bestlen = len;
				} else {
					return `${String.fromCharCode(t)}${str}`;
				}
			}
		}
	
		if((t == null || t == undefined) && (rate != null || rate != undefined)){
			return bestT(string, rate);
		}
	
		if((t == null || t == undefined) && (rate == null || rate == undefined)){
			let bestrlen = Infinity; let len = Buffer.byteLength(string);
			for(let i = 0; i < 100; i++){
				let str = bestT(string, i);
				let len = Buffer.byteLength(str);
				if(len <= bestrlen){
					bestrlen = len;
				} else {
					return bestT(string, i-1);
				}
			}
		}
	
		for(let i = 0; i < t; i++){
			string = run(string, rate);
		} return `${String.fromCharCode(t)}${string}`;
	}

	decompress(string){
		function run(string) {
			let lenheader = string.charCodeAt(0); let counter = 1;
			let replacer = []; let str = string;
			let header = ""; header += string.charAt(0); counter++;
			for(let i = 0; i < lenheader; i++){
				let initial = str.charCodeAt(counter-1);
				let lenmsg = str.charCodeAt(counter);
				let msg = str.substring(counter+1, counter+1+lenmsg);
				header += `${String.fromCharCode(initial)}${String.fromCharCode(lenmsg)}${msg}`;
				counter += lenmsg+2;
				replacer.push({initial: String.fromCharCode(initial), msg: msg, len: lenmsg});
			}
	
			string = string.substring(counter-1, string.length);
	
			for(let i of replacer){
				string = string.replaceAll(i.initial, i.msg);
			}
			return string;
		}
	
		let t = string.charCodeAt(0); string = string.substring(1);
	
		for(let i = 0; i < t; i++){
			string = run(string);
		} return string;
	}

	randomLetter(len = 5){
		let s = '';
		for(let i = 0; i < len; i++) s += String.fromCharCode(Math.floor(Math.random()*0xFFFF));
		return s;
	}

	#setup(){
		try{
		let p = this.randomPrime(Math.round(Math.random()*0xFF)+0x2); // random prime number
		let q = this.randomPrime(Math.round(Math.random()*0xFF)+0x2); // random prime number
		// p cannot be equal to q

		let m = (p-1n)*(q-1n);
		// m cannot be 0

		// recalculate if there is any invalid number
		while(p===q || m===0n || !p.isPrime() || !q.isPrime()){
			p = this.randomPrime();
			q = this.randomPrime();
			m = (p-1n)*(q-1n);
		}
		let n = p*q;

		let e = this.randomRelativelyPrime(m); // e is random number relatively prime to m
		let d = 0;
		while(e.gcd(m)!==1n) e = this.randomRelativelyPrime(m);
		d = e.inverseMod(m);

		// d must be positive
		// limits d value if it is too big (max 10000)
		if(d>=0xFFFFn || d < 0n) return this.#setup();
		// Test encryption and decryption
		this.publicKey.push({e, n});
		this.#privateKey.push({d, n});
		for(let i = 0; i < 5; i++){
			let testLetter = this.randomLetter();
			if(this.decrypt(this.encrypt(testLetter))!=testLetter) {
				this.publicKey.pop();
				this.#privateKey.pop();
				return this.#setup();
			}
		}
		return [e, n, d];
		}catch(e){
			return this.#setup();
		}
	}

	#encrypt_(message = 12392, key={e:this.publicKey.e, n:this.publicKey.n}){
		return BigInt(message).pow(key.e).mod(key.n);
	}

	#decrypt_(message = 2131, key={d:this.#privateKey.d, n:this.#privateKey.n}){
		return BigInt(message).pow(key.d).mod(key.n);
	}

	encrypt(message = "ABC"){
		let res = '';
		for(let char of message){
			if(res.length != 0) res += ' ';
			let messageInt = char.charCodeAt(0);
			for(let key of this.publicKey){
				messageInt = this.#encrypt_(messageInt, key);
			} res += this.toUnicode(messageInt);
		} return res;
	}

	decrypt(message = "4c x2d 2a"){
		let res = ''; message = message;
		let messageInt = 0;
		for(let char of message.split(' ')){
			messageInt = this.parseUnicode(char);
			this.#privateKey.reverse();
			for(let key of this.#privateKey){
				messageInt = this.#decrypt_(messageInt, key);
			} this.#privateKey.reverse();
			res += String.fromCharCode(messageInt.toString());
		} return res;
	}

	// compile to javascript to run with eval(compileEncryptionCode...)
	compileEncryptionCode(){
		let code = "(message)=>{\"use strict\";";
		code += "function toUnicode(int){let a='';for(let i=int;i>=1n;i=i/(0xFFFFn+1n)){i--;a+=String.fromCharCode((i%(0xFFFFn+1n)).toString());}return a.split('').reverse().join('');}";
		code += "BigInt.prototype.pow=function(n){return this**BigInt(n);};"
		code += "BigInt.prototype.mod=function(n){return this%BigInt(n);};";
		code += "let b='';";
		code += "for(let c of message){";
		code += "if(b.length!=0)b+=' ';";
		code += "let a=BigInt(c.charCodeAt(0));";
		for(let key of this.publicKey){
			code += `a=a.pow(${key.e}n).mod(${key.n}n);`;
		}
		code += "b+=toUnicode(a);";
		code += "}return b;";
		code += "}";
		return code;
	}
}

let bob = new secure(3);

let message = `Karena satu sekolah hanya bisa mengirim satu peserta persekolah, untuk setiap bidang lomba (kecuali untuk bidang vokal solo dan film pendek), maka sekolah akan menyeleksi karya yang akan diajukan sebagai peserta.Kepada siswa yang ingin mengikuti perlombaan tersebut dipersilakan untuk mendaftar dengan mengirimkan karyanya paling lambat Senin, 18 Juli 2022. Karya yang dibuat harus sesuai dengan juknis (petunjuk teknis) yang terdapat dalam buku panduan FLS2N. Mohon bisa membaca dan memahami panduan tersebut (terlampir di bawah ini).`;

let encrypt = bob.encrypt(message);
console.log(bob.compileEncryptionCode());