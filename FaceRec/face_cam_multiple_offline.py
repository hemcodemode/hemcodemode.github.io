def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


try:
    import numpy as np
    import face_recognition2 as face_recognition
    import cv2,os,json,time,timeit
    import thread
    from facePredict import GetFaceName
    from FacePunchIn import DoPunchIn
    from sklearn import svm
    from sklearn.calibration import CalibratedClassifierCV
    from sklearn import preprocessing
    import cPickle
    import csv
    import warnings
    import win32com.client as wincl
    from time import localtime, strftime
    import dlib
    import re
    warnings.filterwarnings("ignore", category=DeprecationWarning) 
    print('success imports')
except Exception as e:
    print(e)
    input("failed importing")

clf = None
le = preprocessing.LabelEncoder()
BASE = os.path.dirname(os.path.abspath(__file__))
App_Setting = {}

def bb_to_rect(x, y, w, h):
    return (y, x+w, y+h, x)
def LoadSettings():
    global App_Setting
    APPCONFIG = 'app.config'
    default_settings = {} 
    if(not os.path.exists(APPCONFIG)):
        with open(APPCONFIG, 'w') as fid:
            default_settings = {
                            'camera_source':0,
                            'camera_auth':'',
                            'camera_pass':'',
                            'detection_threshold':0.75,
                            'ispunchin':False,
                            'subscription':'product',
                            'punchinurl':'https://dev.zinghr.com/Recruitment/ZingHRTC/FacePunchIn' 
                        }

            fid.write(json.dumps(default_settings,sort_keys=True,indent=4, separators=(',', ': ')))
    else:
        with open(APPCONFIG, 'r') as fid:
            try:
                default_settings = json.loads(fid.read())
            except Exception as e:
                print('App.config invalid loading default settings',e)
                default_settings = {
                            'camera_source':0,
                            'camera_auth':'',
                            'camera_pass':'',
                            'detection_threshold':0.75,
                            'ispunchin':False,
                            'subscription':'product',
                            'punchinurl':'https://dev.zinghr.com/Recruitment/ZingHRTC/FacePunchIn'  
                        }
                print(default_settings)
    App_Setting = default_settings 
    print('App_Setting loaded')      

def LoadOfflineModel():
    global clf
    global le
    vectorData = []
    CSVFILE  = os.path.join(BASE,'face_model_data')
    CSVFILE = os.path.join(CSVFILE,'face_features.csv') 
    MODELFILE  = os.path.join(BASE,'face_model_data','classifier_svm.pkl')
    if(not os.path.exists(CSVFILE)):
        print('No Models available right now. You can create it by adding faces')
        exit()
    with open(CSVFILE, 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='|')
        for row in reader:
            vectorData.append(row)
    AllClasses = []
    for classess in range(1,len(vectorData)):
        AllClasses.append(vectorData[classess][-1])
    AllClasses = list(set(AllClasses))
    Classes = AllClasses
    le.fit(Classes)
    with open(MODELFILE, 'rb') as fid:
        clf = cPickle.load(fid)
    print('offline model loaded')

def GetImageInThread(multiClassList):
    global facepredicted
    global facepredicted2
    global clf
    global le
    try:
        # facepredicted = GetFaceName(multiClassList)
        final_vec  = [x[:-1] for x in multiClassList]
        # final_vec  = multiClassList
        prediction = clf.predict(final_vec)
        probs = clf.predict_proba(final_vec)
        # print prediction
        names = le.inverse_transform(prediction)
        probabilites = [max(prob) for prob in probs]
        facepredicted2 = [(n,p) for (n,p) in zip(names,probabilites)]
        # print (facepredicted2)
    except Exception as e:
        print(e)
        pass
    return True

def DetectImageInThread(rgb_small_frame):
    global face_locations
    global face_encodings
    global multiClassList
    global face_names
    gray=cv2.cvtColor(rgb_small_frame,cv2.COLOR_BGR2GRAY)
    # start = timeit.default_timer()
    # faces = faceCascade.detectMultiScale(gray, 1.3, 5)
    # print 'cv took -->',timeit.default_timer() - start
    # print([dlib.rectangle(int(x), int(y), int(x + w), int(y + h)) for (x,y,w,h) in faces])
    # if not faces.any():
    #     return True
    # start = timeit.default_timer()
    # face_locations = [bb_to_rect(x,y,w,h) for (x,y,w,h) in faces]  
    face_locations = face_recognition.face_locations(gray)
    # print 'cv took -->',timeit.default_timer() - start
    # print("face_locations",face_locations)
    if(face_locations):
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        # print len(face_encodings)
        face_names = []
        multiClassList = []
        for temp_image_encoding in face_encodings:
            dd = list(temp_image_encoding)
            dd.append("id"+str(len(multiClassList)))
            multiClassList.append(dd)
        if(face_encodings):
            GetImageInThread(multiClassList)
    
 
def IsSpoofAttack(img,locations):
    spoof = []
    faceBoundary = 10
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    cl1 = clahe.apply(gray)
    gray = cl1
    img_hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    hue, s, v = cv2.split(img_hsv)
    img_blur = cv2.bilateralFilter(gray,9,75,75)
    gray2 = cv2.bitwise_not(img_blur)
    thresh = cv2.threshold(gray2, 0, 255,
    cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    for (top, right, bottom, left) in (locations):
        try:
            avg_color_per_row = np.average(thresh[top+faceBoundary+10:bottom-faceBoundary+5, left+faceBoundary+5:right-faceBoundary-5], axis=0)
            avg_color = np.average(avg_color_per_row, axis=0)
            avg_color_per_row2 = np.average(hue[top+faceBoundary+10:bottom-faceBoundary+5, left+faceBoundary+5:right-faceBoundary-5], axis=0)
            avg_color2 = np.average(avg_color_per_row2, axis=0)
            print(avg_color,avg_color2)
            if (avg_color>190 and (avg_color2<28 and avg_color2>10)):
                spoof.append([1,int((avg_color/255)*100)])
                # cv2.imwrite("2.jpg",img)
                # cv2.imwrite("1.jpg",thresh)
            else:
                spoof.append([0,100-int((avg_color/255)*100)])
        except Exception as e:
            print(e)
            spoof.append([0,100])
        
    return spoof    

def AddNewFace():
    while True:
        name = raw_input("\nPlease Enter Name\n")
        if(name.strip() != ""):
            break
    print('Please face camera for adding the face into system...')
    video_capture = cv2.VideoCapture(App_Setting['camera_source'])
    facecount = 0
    multiClassList = []
    while True:
        if(facecount>=20):
            break
        ret, frame = video_capture.read()
        frame = cv2.flip(frame, 1 )
        cv2.imshow('Video', frame)
        # small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
        rgb_small_frame = frame[:, :, ::-1]
        face_locations = face_recognition.face_locations(rgb_small_frame)
        if(face_locations):
            for (top, right, bottom, left) in face_locations:
                color = (0, 0, 255)
                cv2.rectangle(frame, (left, top), (right, bottom), color , 2)
                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(frame,str(facecount) , (left, top - 6), font, 0.7, (255, 255, 255), 1)
            face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
            for temp_image_encoding in face_encodings:
                dd = list(temp_image_encoding)
                dd.append(name)
                multiClassList.append(dd)
                facecount +=1
        cv2.imshow('Video', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    CSVFILE  = os.path.join(BASE,'face_model_data')
    CSVFILE = os.path.join(CSVFILE,'face_features.csv') 
    if(not os.path.exists(CSVFILE)):
        print('Model file not exists creating it')
        try:
            os.makedirs(os.path.dirname(CSVFILE)) 
            with open(CSVFILE, 'ab') as fp:
                a = csv.writer(fp, delimiter=',')
                a.writerows([['Col'+str(x) for x in range(1,130) ]])
        except Exception as e:
            print('')
    with open(CSVFILE, 'ab') as fp:
        a = csv.writer(fp, delimiter=',')
        a.writerows(multiClassList)
    print("Images processed")
    TrainFace()

def TrainFace():
    print('Training...')
    global le
    vectorData = []
    CSVFILE  = os.path.join(BASE,'face_model_data')
    CSVFILE = os.path.join(CSVFILE,'face_features.csv') 
    with open(CSVFILE, 'rb') as csvfile:
        reader = csv.reader(csvfile, delimiter=',', quotechar='|')
        for row in reader:
            vectorData.append(row)
    AllClasses = []
    for classess in range(1, len(vectorData)):
        AllClasses.append(vectorData[classess][-1])
    dataY = AllClasses
    AllClasses = list(set(AllClasses))
    dataX = []
    for data in range(1, len(vectorData)):
        dataX.append([ float(x) for x in vectorData[data][0:-1]])
    Classes = AllClasses
    le.fit(Classes)
    X = dataX
    y = dataY
    encodedClass =  le.transform(y)
    Y = encodedClass
    clfLinearSVC = svm.LinearSVC(C=100.0, random_state=42)
    clf = CalibratedClassifierCV(clfLinearSVC) 
    try:
        clf.fit(X, Y)
        MODELFILE  = os.path.join(BASE,'face_model_data','classifier_svm.pkl')
        with open(MODELFILE, 'wb') as fid:
            cPickle.dump(clf, fid)
        print('Training successful')
    except Exception as e:
       print('Since you are first member, please add another person and complete the training process')
    

def ReloadConfig(event, x, y, flags, param):
    global threshold2
    global App_Setting
    global LoadingStatus
    if event == cv2.EVENT_LBUTTONDOWN:
        if(x>=frameWidth-180 and x<=frameWidth-95 and y>=195 and y<=195+25):
            LoadingStatus = 'Reloading...'
            print('Reloading...',x,y,flags,param)
            LoadSettings()
            TrainFace()
            LoadOfflineModel()
            threshold2 = App_Setting['detection_threshold']
            LoadingStatus = 'Reload Config'


LoadSettings()
while(True):
    print('Welcome, please choose options\n')
    print('1. Recognition')
    print('2. Adding new face')
    print('3. For training')
    val = raw_input("\nEnter you choice\n")
    if(val=='1' or val=='2' or val=='3'):
        break
if(val=='1'):    
    LoadOfflineModel()
    video_capture = cv2.VideoCapture(App_Setting['camera_source'])
    # video_capture = cv2.VideoCapture("rtsp://hemantm:Admin@147@192.168.100.20/h264/ch6/sub/av_stream?videoResolutionWidth=1920&videoResolutionHeight=1080")
    BASE = os.path.dirname(os.path.abspath(__file__))
    datapath = resource_path("data")
    cascadePath = datapath+"\\haarcascade_frontalface_default.xml"
    faceCascade = cv2.CascadeClassifier(cascadePath)
    path = '/TempImages'
    fullpath =  BASE+path+"/"
    faces_dict = {}
    known_face_encodings = []
    known_face_names = []
    print len(known_face_encodings)
    # Initialize some variables
    face_locations = []
    face_encodings = []
    face_names = []
    process_this_frame = True
    facepredicted = []
    facepredicted2 = []
    threshold = 0.75
    start1 = time.clock()
    previousName = ""
    vistedList = []
    threshold2 = App_Setting['detection_threshold']
    cv2.namedWindow("Video", cv2.WND_PROP_FULLSCREEN)
    cv2.setMouseCallback('Video', ReloadConfig)
    speak = wincl.Dispatch("SAPI.SpVoice")
    frameWidth = 0
    LoadingStatus = 'Reload Config'
    # cv2.setWindowProperty("Video",cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
    while True:
        # Grab a single frame of video
        ret, frame = video_capture.read()
        frame = cv2.flip(frame, 1 )
        # Resize frame of video to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)

        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = small_frame[:, :, ::-1]
        # rgb_small_frame = frame[:, :, ::-1]
        width = frame.shape[1]
        frameWidth = width
        cv2.rectangle(frame,(width-180,0),(width,190),(255,255,255),cv2.FILLED)
        cv2.rectangle(frame,(width-180,195),(width-95,195+25),(255,0,0),cv2.FILLED)
        cv2.rectangle(frame,(width-90,195),(width,195+25),(255,0,0),cv2.FILLED)
        for (i,v )in enumerate(vistedList): 
            cv2.putText(frame, v['empcode'] + " - "+v['time'] , (width-175, (i+1)*20), cv2.FONT_HERSHEY_SIMPLEX , 0.5, (255, 0, 0), 1,cv2.LINE_AA)
        
        cv2.putText(frame, LoadingStatus , (width-175, 195+17), cv2.FONT_HERSHEY_SIMPLEX , 0.3, (255, 255, 255), 1,cv2.LINE_AA)
        cv2.putText(frame, "Sync Attendance" , (width-85, 195+17), cv2.FONT_HERSHEY_SIMPLEX , 0.3, (255, 255, 255), 1,cv2.LINE_AA)

        # Only process every other frame of video to save time
        if process_this_frame:
            # Find all the faces and face encodings in the current frame of video
            try:
                # thread.start_new_thread(DetectImageInThread,(rgb_small_frame,))
                cv2.imshow('Video', frame)
                DetectImageInThread(rgb_small_frame)
                cv2.imshow('Video', frame)
                pass
            except Exception as e:
               print "Error: unable to start thread",e
                   
            # print(dd)
            # for face_encoding in face_encodings:
            #     # See if the face is a match for the known face(s)
            #     matches = face_recognition.compare_faces(known_face_encodings, face_encoding,tolerance=0.5)
            #     name = "Unknown"

            #     # If a match was found in known_face_encodings, just use the first one.
            #     if True in matches:
            #         first_match_index = matches.index(True)
            #         name = known_face_names[first_match_index]

            #     face_names.append(name)

        process_this_frame = not process_this_frame

        i = 0
        # Display the results
        facepredictedTemp = facepredicted[:]
        facepredictedTemp2 = facepredicted2[:]
        isSpoof = IsSpoofAttack(small_frame,face_locations)
        for (top, right, bottom, left) in face_locations:
            # Scale back up face locations since the frame we detected in was scaled to 1/4 size
            top *= 2
            right *= 2
            bottom *= 2
            left *= 2
            color = (0, 0, 255)
            if(len(isSpoof)-1>=i):
                if(isSpoof[i][0]==1):
                    color = (0, 255, 0)
                else:
                    color = (0, 0, 255)
            # Draw a box around the face
            cv2.rectangle(frame, (left, top), (right, bottom), color , 2)

            # Draw a label with a name below the face
            cv2.rectangle(frame, (left, bottom - 35), (right, bottom), color, cv2.FILLED)
            font = cv2.FONT_HERSHEY_SIMPLEX
            if(len(facepredictedTemp)-1>=i):
                prob = max(facepredictedTemp[i][129:-1],key=lambda p:float(p))
                print(str(facepredictedTemp[i][-1]),float(prob))
                if(float(prob)>threshold):
                    cv2.putText(frame,str(facepredictedTemp[i][-1]) , (left + 6, bottom - 6), font, 0.7, (255, 255, 255), 1, cv2.LINE_AA)
            if(len(facepredictedTemp2)-1>=i):
                prob = facepredictedTemp2[i][1]
                currentname = str(facepredictedTemp2[i][0])
                print(currentname,float(prob))
                if(float(prob)>threshold2):
                    cv2.putText(frame,currentname , (left + 6, bottom - 6), font, 0.7, (255, 255, 255), 1, cv2.LINE_AA)
                    if(time.clock()-start1>30 or previousName != currentname):
                        if(len(vistedList)>=9):
                            vistedList.pop()
                            vistedList.insert(0,{
                            'empcode':currentname,
                            'time':strftime("%H:%M:%S", localtime())
                            })
                        else:
                            vistedList.insert(0,{
                            'empcode':currentname,
                            'time':strftime("%H:%M:%S", localtime())
                            })
                        AttendanceCSVFILE  = os.path.join(BASE,'face_model_data','AttendanceData',strftime("%d-%m-%Y", localtime()))
                        AttendanceCSVFILE = os.path.join(AttendanceCSVFILE,'attendace.csv') 
                        if(not os.path.exists(AttendanceCSVFILE)):
                            print('attendace.csv file not exists creating it')
                            try:
                                os.makedirs(os.path.dirname(AttendanceCSVFILE)) 
                            except Exception as e:
                                print('')
                        try:
                            with open(AttendanceCSVFILE, 'ab') as fp:
                                a = csv.writer(fp, delimiter=',')
                                a.writerow([currentname,strftime("%Y-%m-%d %H:%M:%S", localtime())])
                        except Exception as e:
                             print('please close attendace.csv file to append new data.')
                        speak.Speak("Welcome "+re.sub(r'(\d)',r'\1 ',currentname))
                        start1 = time.clock()
                        previousName = currentname
                        if(App_Setting['ispunchin']):
                            print("DOING PUNCHIN FOR",currentname)
                            thread.start_new_thread(DoPunchIn,(currentname,App_Setting['subscription'],App_Setting['punchinurl']))     
            i+=1
        # Display the resulting image
        cv2.imshow('Video', frame)

        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release handle to the webcam
    video_capture.release()
    cv2.destroyAllWindows()
elif(val=='2'):
    AddNewFace()
elif(val=='3'):
    TrainFace()