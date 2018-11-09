# -*- mode: python -*-

block_cipher = None


a = Analysis(['face_cam_multiple_offline.py'],
             pathex=['D:\\HemantProjects\\OPencvExamples\\dist'],
             binaries=[],
             datas=[('face_recognition2\\face_recognition_models\\models','face_recognition2\\face_recognition_models\\models'),('scipy','scipy'),('favicon.ico','favicon.ico'),('data', 'data')],
             hiddenimports=['scipy._lib.messagestream','scipy.sparse.linalg.isolve._iterative','sklearn.utils.seq_dataset','weight_vector.pyd','cython', 'sklearn', 'sklearn.neighbors.typedefs','scipy'],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='face_cam_multiple_offline',
          debug=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,icon='favicon.ico',
          console=False )
