const fs            = require('fs');
const splitFile     = require('split-file');
const async         = require('async');
const crypto        = require('crypto');
const path          = require("path");
const encryptor     = require('file-encryptor');
const stego         = require("stegosaurus");

var _hybridCrypto = function(){
    var that = this;
    //helper method
    var deleteFiles = function(files, callback){
        if (!files || files.length==0) return callback();
        else {
           var f = files.pop();
           f.replace(/\//g, '\\').replace(/\\\\/g, '\\');
           fs.unlink(f, function(err){
              if (err) callback(err);
              else {
                 console.log(f + ' deleted.');
                 deleteFiles(files, callback);
              }
           });
        }
    }
    function store(_file, _numParts, _encryptCallback){
        var num_parts = (_numParts > 0 ) ? _numParts : 3;
        var algos = ['aes256','aes192','aes128','des3','rc2'];
        var counter = 0;
        var delete_files = false;
        var data = {
            size: false,
            orig: false,
            encrypted_files: [],
            parts: false,
            parts_copy: false,
            image: false,
        }
    
        var init = function(){
            console.log("Beginning hybrid crypto process");
            var executionOrder = [
                split,
                encryptParts,
                createImage,
            ]
            async.waterfall(executionOrder, done);
        }
    
        var split = function(callback){
            data.orig = _file;
            splitFile.splitFile(__dirname + '/' + _file, num_parts)
                .then((parts) => {
                    data.parts = parts;
                    data.parts_copy = parts.slice(0);
                    return callback();
                })
                .catch((err) => {
                    console.log('Error: ', err);
                    return callback(err);
                });
        }
    
        var encryptParts = function(callback){
            if(data.parts_copy.length == 0)
                return callback();
            counter = (counter + 1 == algos.length) ? 0 : counter + 1;
            var input = data.parts_copy.pop();
            var output = `encrypted_${Math.random().toString(9).substr(2, 10)}_${Date.now()}.dat`;
            var key = crypto.randomBytes(64).toString('hex');
            var options = { algorithm: algos[counter] };
            data.encrypted_files.push({
                algo: algos[counter],
                key: key,
                input: path.basename(input),
                output: output
            });
            encryptor.encryptFile(input, `./stored/${output}`, key, options, function(err) {
                // Encryption complete.
                if(err)
                    return callback(err);
                else
                    return encryptParts(callback);
            });
        }
    
        var createImage = function(callback){
            var original_png = "key.png";		// The original png file.
            delete_files = data.parts.slice(0);
            delete_files.push(__dirname + '/' + data.orig);
            delete data.parts;
            delete data.parts_copy;
            data.size = JSON.stringify(data).length - 1;
            var message_string = JSON.stringify(data);
            var generated_png = `key_${message_string.length}_${Math.random().toString(9).substr(2, 10)}_${Date.now()}.png`;// The resulting file.
            stego.encodeString(original_png,generated_png,message_string,function(err){
                if (err) { throw err; }
                data.image = generated_png;
                // Now let's decode that.
                return callback();
            });
        }

        var done = function(err){
            if(err)
                console.log(err);
            else
                console.log('Finished hybrid cryptography storage - returning image');
            deleteFiles(delete_files, function(){
                console.log("Deleted all parts!");
            });
            //delete original file
            //return steganography image
            //if(typeof _encryptCallback == 'function')
            console.log("Running encrypt callback");
            _encryptCallback(err, data);
        }
    
        init();
    }
    function restore(_file, _downloadCallback){
        var delete_files = [];
        var data = {
            orig: false,
            result: false,
            files: false,
            encrypted_files: false,
            parts: [],
        }
        var init = function(){
            if(!_file){
                _downloadCallback("No file provided");
            }
            var executionOrder = [
                readImage,
                decryptParts,
                merge,
            ]
            async.waterfall(executionOrder, done);
        }

        var readImage = function(callback){
            var bits;
            var renamed = false;
            try {
                bits = _file.split('_')[1];
            } catch (error) {
                renamed = true;
                bits = 20;
            } 
            console.log(bits);
            delete_files.push(__dirname + '/' + _file);
            stego.decode(__dirname + '/' + _file, bits, function(payload){
                var result;
                if(renamed){
                    var full_bits = parseInt(payload.split(":")[1]);
                    stego.decode(__dirname + '/' + _file, full_bits, function(payload){
                        result = setReadData(payload);
                        if(!result)
                            return callback(err);
                        else
                            return callback();

                    });
                }
                result = setReadData(payload)
                if(!result)
                    return callback(err);
                else
                    return callback();
            });
        }

        var setReadData = function(payload){
            try {
                var payload = JSON.parse(payload);
                data.orig = payload.orig;
                data.encrypted_files = payload.encrypted_files;
                return true;
            } catch (error) {
                return false;
            }
        }

        var decryptParts = function(callback){
            if(data.encrypted_files.length == 0)
                return callback();
            var item = data.encrypted_files.pop();
            var encrypted = `./stored/${item.output}`;
            var decrypted = `./restored/${item.input}`;
            var key = item.key;
            var options = { algorithm: item.algo };
            data.parts.push(decrypted);
            delete_files.push(decrypted);
            encryptor.decryptFile(encrypted, decrypted, key, options, function(err) {
                // Encryption complete.
                if(err)
                    return callback(err);
                else
                    return decryptParts(callback);
            });
        }

        var merge = function(callback){
            orig = __dirname + '/' + _file;
            var name = path.parse(data.orig).name;
            var ext = path.parse(data.orig).ext;
            data.result = `${name}_restored_${Date.now()}${ext}`;
            splitFile.mergeFiles(data.parts, __dirname + '/' + data.result)
                .then(() => {
                    return callback();
                });
        }

        var done = function(err){
            if(err)
                console.log(err);
            else
                console.log('Finished hybrid cryptography restore - returning file');
            //return steganography image
            console.log("Running download callback");
            _downloadCallback(err, data);
            deleteFiles(delete_files, function(){
                console.log("Deleted all parts!");
            });
        }

        init();
    }
    that.store      = store;
    that.restore    = restore;
}

/* var file = 'SSR_TSRPT.pdf';
var restore_file = 'key_1017_6115543638_1556517416530.png';

var hybridCryptoObject = new _hybridCrypto;
//hybridCryptoObject.store(file, 4, encryptedResponse);
hybridCryptoObject.restore(restore_file, downloadResponse)

function encryptedResponse(err, data){
    console.log(data);
}
function downloadResponse(err, data){
    console.log(data);
} */
module.exports = new _hybridCrypto;