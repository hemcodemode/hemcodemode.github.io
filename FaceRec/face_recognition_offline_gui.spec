# -*- mode: python -*-

block_cipher = None


a = Analysis(['face_recognition_offline_gui.py'],
             pathex=['D:\\HemantProjects\\OPencvExamples\\dist'],
             binaries=[('opencv_ffmpeg341_64.dll','.')],
             datas=[('face_recognition2\\face_recognition_models\\models','face_recognition2\\face_recognition_models\\models'),('scipy','scipy'),('data', 'data'),('assets', 'assets')],
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
          name='face_recognition_offline_gui',
          debug=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,icon='assets\\favicon.ico',
          console=True )
