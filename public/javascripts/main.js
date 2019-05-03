var uploaderObject;
$(function(){
    uploaderObject = new _uploader();
})
var _uploader = function(){
    var that = this;
    var ui = {
        encrypt: {
            button: $('.upload.encrypt'),
            input: $('#encrypt_upload'),
        },
        decrypt: {
            button: $('.upload.decrypt'),
            input: $('#decrypt_upload'),
        }
    }

    var init = function(){
        ui.encrypt.button.fileupload({
            url: '/upload?type=encrypt',
            dataType: 'json',
            sequentialUploads: true,
            dropZone: ui.encrypt.button,
            fileInput: ui.encrypt.input,
            done: function (e, data) {
                console.log(data);
            }
        })
        ui.decrypt.button.fileupload({
            url: '/upload?type=decrypt',
            dataType: 'json',
            sequentialUploads: true,
            dropZone: ui.decrypt.button,
            fileInput: ui.decrypt.input,
            done: function (e, data) {
                console.log(data);
                location.reload();
            }
        });
        ui.encrypt.button.on('click', function(){ui.encrypt.input.click()});
        ui.decrypt.button.on('click', function(){ui.decrypt.input.click()});
    }
    init();
}