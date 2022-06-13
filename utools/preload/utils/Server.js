const path = require('path')
const express = require('express') // http://expressjs.com/
const multer = require('multer')
const bodyParser = require("body-parser");

const Setting = require('./Setting')
const EventDispatcher = require('./EventDispatcher')
const FileDb = require('./FileDb')

// ����״̬
const StatusStart = "start"
const StatusStop = "stop"

let server;
let status = StatusStop;


// �����ʼ��
const initApp = () => {
    let app = express();
    let rootPath = path.resolve(__dirname, '..')
    app.use(express.static(path.join(rootPath, 'web'), {index: 'download.html'}))
    // ��ȡ�ļ��б�
    app.get('/files', function (req, res) {
        res.json({files: FileDb.listFiles()});
    });
    // �����ļ�
    app.get('/download/:name', function (req, res) {
        let filename = req.params.name
        let filePath = FileDb.getFile(filename).path;
        console.log("send file: " + filePath);
        res.download(filePath)
    });

    // ͨ�� filename ���Զ���
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, Setting.getUploadPath());    // �����·������ע����Ҫ�Լ�����
        },
        filename: function (req, file, cb) {
            // �������ļ�������Ϊ �ֶ��� + ʱ��������� logo-1478521468943
            cb(null, file.originalname);
        }
    });

    // �ϴ��ļ�api
    let upload = multer({storage: storage});
    app.post('/addFile', upload.single('file'), function (req, res, next) {
        let file = req.file;
        FileDb.addFile({name: file.originalname, path: file.path})
        res.redirect('/')
    })

    // �ϴ��ı�
    const urlencodedParser = bodyParser.urlencoded({extended: false});
    app.post('/addText', urlencodedParser, function (req, res, next) {
        let text = req.body.message
        FileDb.addText(text)
        res.redirect('/')
    })

    return app;
}

// ��������
const startServer = () => {
    let port = Setting.getPort();
    const app = initApp()
    console.log("startServer", port)
    server = app.listen(port, () => {
        console.log("start success! download url: " + Setting.getUrl())
        status = StatusStart;
        EventDispatcher.triggerEvent({type: 'server.statusChange', data: {status: StatusStart}})
    });
    return {success: true, message: "�����ɹ�", url: Setting.getUrl()};
}

// �رշ���
const stopServer = () => {
    server.close();
    status = StatusStop;
    EventDispatcher.triggerEvent({type: 'server.statusChange', data: {status: StatusStop}})
}

const getServerStatus = () => {
    return status;
}

exports.startServer = startServer
exports.stopServer = stopServer
exports.getServerStatus = getServerStatus
exports.StatusStart = StatusStart
exports.StatusStop = StatusStop