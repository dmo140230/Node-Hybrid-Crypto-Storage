This project utilizes Node.js, so if it's not installed on your computer please visit 
https://nodejs.org/en/download/

Once it's installed, on a command line set your directory to the base of the project, and then run the following commands to run the project

npm install
npm start

On your browser head to 
localhost:3000/

If you select to upload and encrypt a file, a new key_*_*.png will be created in the file system
as well as a new set of encrypted_*.dat in the stored/ directory, and the console will display the encryption algorithm key information and mapping for each part 
that has now been encoded in the new key image with steganography

To Restore a file, select a previously generated key_*_*.png, and once the process is finished your previous uploaded fill now appear in the base directory of the project with "restored" appened to the filename
If you open this file you can verify that it still contains the original contents of the file, even though it was split apart and encrypted

This project is also available on my github at:
https://github.com/dmo140230/Node-Hybrid-Crypto-Storage 