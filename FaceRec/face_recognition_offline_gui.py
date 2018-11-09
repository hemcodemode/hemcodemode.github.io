def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)


try:
    import threading
    import webbrowser
    from numpy import random
    import tkinter as tk 
    import tkFileDialog
    from tkinter import messagebox
    from Tkinter import *   # from x import * is bad practice
    # from ttk import *
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
    import pyttsx
    from time import localtime, strftime
    import dlib
    import re
    from PIL import ImageTk, Image
    warnings.filterwarnings("ignore", category=DeprecationWarning) 
    print('success imports')
except Exception as e:
    print(e)
    input("failed importing")


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
                            'punchinurl':'https://dev.zinghr.com/Recruitment/ZingHRTC/FacePunchIn',
                            'cctvstreams':""
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
                            'cctvstreams':""  
                        }
                print(default_settings)
    App_Setting = default_settings 
    print('App_Setting loaded')      

def LoadOfflineModel():
    global clf
    global le
    global AllClasses
    vectorData = []
    CSVFILE  = os.path.join(BASE,'face_model_data')
    CSVFILE = os.path.join(CSVFILE,'face_features.csv') 
    MODELFILE  = os.path.join(BASE,'face_model_data','classifier_svm.pkl')
    if(not os.path.exists(CSVFILE)):
        print('No Models available right now. You can create it by adding faces')
        # exit()
        return False
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
    try:
        with open(MODELFILE, 'rb') as fid:
            clf = cPickle.load(fid)
    except Exception as e:
        print('No Models available right now. You can create it by adding faces')
        return False
    
    print('offline model loaded')
    return True

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

def AddNewFace(name):
    global isStart
    global r
    global speak
    global VideoCanvas,popupstatus,canvas_width,canvas_height
    isStart = False
    if(name==""):
        while True:
            r.update()
            name = raw_input("\nPlease Enter Name\n")
            if(name.strip() != ""):
                break
    print('Please face camera for adding the face into system...')
    r.title('Adding face...')
    video_capture = cv2.VideoCapture(App_Setting['camera_source'])
    facecount = 0
    multiClassList = []
    while True:
        r.update()
        r.title('Processed '+str(facecount)+' out of 20 images')
        if(facecount>=20):
            break
        ret, frame = video_capture.read()
        frame = cv2.flip(frame, 1 )
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
        
        if(popupstatus):
            cv2.imshow('Video', frame)
            VideoCanvas.delete("all")
            VideoCanvas.create_text(canvas_width / 2,canvas_height / 2,text="Hide popup to show video here")  
        else:
            photo = ImageTk.PhotoImage(image = Image.fromarray(frame[:, :, ::-1]))
            VideoCanvas.create_image(0, 0, image = photo,anchor=tk.NW)
            cv2.destroyWindow('Video')

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    video_capture.release()
    cv2.destroyAllWindows()
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
    r.title('20 images processed, now training')
    r.update()
    speak.Speak("Face Successfully added into the system")
    # TextToSpeech("Face Successfully added into the system")
    TrainFace()

def TrainFace():
    global r
    print('Training...')
    r.title('Training...')
    r.update()
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
       messagebox.showinfo("Add another","Since you are only person in the system, please add another person and complete the training process")
    r.title('Training done ready for recognition')
    r.update()
    messagebox.showinfo("Success","Training done ready for recognition")
    
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

def FaceRecognitionMain():
    HideActions()
    LoadSettings()
    if(not LoadOfflineModel()):
        messagebox.showinfo("Error","No data found, please add atleast two person in the system")
        return False
    video_capture = cv2.VideoCapture(App_Setting['camera_source'])
    # video_capture = cv2.VideoCapture("rtsp://hemantm:Admin@147@192.168.100.20/h264/ch6/sub/av_stream?videoResolutionWidth=1920&videoResolutionHeight=1080")
    datapath = resource_path("data")
    cascadePath = datapath+"\\haarcascade_frontalface_default.xml"
    faceCascade = cv2.CascadeClassifier(cascadePath)
    path = '/TempImages'
    fullpath =  BASE+path+"/"
    # load global variables
    global faces_dict,known_face_encodings,known_face_names,face_locations,face_encodings,face_names,process_this_frame
    global facepredicted,facepredicted2,threshold,start1,previousName,vistedList,threshold2,speak,frameWidth,LoadingStatus
    global isStart
    global r
    global VideoCanvas,popupstatus,bgphoto
    faces_dict = {}
    known_face_encodings = []
    known_face_names = []
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
    # cv2.namedWindow("Video", cv2.WND_PROP_FULLSCREEN)
    cv2.setMouseCallback('Video', ReloadConfig)
    frameWidth = 0
    LoadingStatus = 'Reload Config'

    isStart = True
    r.title('Recognising...')
    # cv2.setWindowProperty("Video",cv2.WND_PROP_FULLSCREEN,cv2.WINDOW_FULLSCREEN)
    while True:
        r.update()
        # Grab a single frame of video
        ret, frame = video_capture.read()
        frame = cv2.flip(frame, 1 )
        frame = cv2.resize(frame, (640, 480))
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
                DetectImageInThread(rgb_small_frame)
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
                        # TextToSpeech("Welcome "+re.sub(r'(\d)',r'\1 ',currentname))
                        start1 = time.clock()
                        previousName = currentname
                        if(App_Setting['ispunchin']):
                            print("DOING PUNCHIN FOR",currentname)
                            thread.start_new_thread(DoPunchIn,(currentname,App_Setting['subscription'],App_Setting['punchinurl']))     
            i+=1
        # Display the resulting image
        if(popupstatus):
            cv2.namedWindow("Video", cv2.WND_PROP_FULLSCREEN)
            cv2.imshow('Video', frame)
            VideoCanvas.delete("all")
            VideoCanvas.create_text(canvas_width / 2,canvas_height / 2,text="Hide popup to show video here")  
        else:
            photo = ImageTk.PhotoImage(image = Image.fromarray(frame[:, :, ::-1]))
            VideoCanvas.create_image(0, 0, image = photo,anchor=tk.NW)
            cv2.destroyWindow('Video')

        # Hit 'q' on the keyboard to quit!
        if (cv2.waitKey(1) & 0xFF == ord('q')) or isStart==False:
            break

    # Release handle to the webcam
    isStart = False
    video_capture.release()
    cv2.destroyAllWindows()
    VideoCanvas.create_image(0, 0, image = bgphoto,anchor=tk.NW)

class VerticalScrolledFrame(Frame):
    """A pure Tkinter scrollable frame that actually works!
    * Use the 'interior' attribute to place widgets inside the scrollable frame
    * Construct and pack/place/grid normally
    * This frame only allows vertical scrolling

    """
    def __init__(self, parent, *args, **kw):
        Frame.__init__(self, parent, *args, **kw)            

        # create a canvas object and a vertical scrollbar for scrolling it
        vscrollbar = Scrollbar(self, orient=VERTICAL)
        vscrollbar.pack(fill=Y, side=RIGHT, expand=FALSE)
        canvas = Canvas(self, bd=0, highlightthickness=0,
                        yscrollcommand=vscrollbar.set)
        canvas.pack(side=LEFT, fill=BOTH, expand=TRUE)
        vscrollbar.config(command=canvas.yview)

        # reset the view
        canvas.xview_moveto(0)
        canvas.yview_moveto(0)

        # create a frame inside the canvas which will be scrolled with it
        self.interior = interior = Frame(canvas)
        interior_id = canvas.create_window(0, 0, window=interior,
                                           anchor=NW)

        # track changes to the canvas and frame width and sync them,
        # also updating the scrollbar
        def _configure_interior(event):
            # update the scrollbars to match the size of the inner frame
            size = (interior.winfo_reqwidth(), interior.winfo_reqheight())
            canvas.config(scrollregion="0 0 %s %s" % size)
            if interior.winfo_reqwidth() != canvas.winfo_width():
                # update the canvas's width to fit the inner frame
                canvas.config(width=interior.winfo_reqwidth())
        interior.bind('<Configure>', _configure_interior)

        def _configure_canvas(event):
            if interior.winfo_reqwidth() != canvas.winfo_width():
                # update the inner frame's width to fill the canvas
                canvas.itemconfigure(interior_id, width=canvas.winfo_width())
        canvas.bind('<Configure>', _configure_canvas)

def StopCam():
    HideActions()
    global isStart,r,VideoCanvas,bgphoto
    isStart = False
    r.title('Face Recogntion System')
    VideoCanvas.create_image(0, 0, image = bgphoto,anchor=tk.NW)  

def AddNewAction():
    E1.delete(0, 'end')
    L1.pack()
    E1.pack()
    button6.pack(pady=3)

def HideActions():
    L1.pack_forget()
    E1.pack_forget()
    button6.pack_forget()

def Save():
    L1.pack_forget()
    E1.pack_forget()
    button6.pack_forget()
    if(len(E1.get().strip())>0):
        AddNewFace(E1.get().strip())

def TogglePopUpVideo():
    global popupstatus,button7
    popupstatus = not popupstatus
    button7["text"] = "Smallscreen Mode" if popupstatus else "Fullscreen Mode"

def ShowRegisteredEmployees():
    HideActions()
    if(not LoadOfflineModel()):
        messagebox.showinfo("Error","No data found, please add atleast two person in the system")
        return False

    global r
    global AllClasses
    allemployees = []
    AllClassesTemp = sorted(AllClasses)
    window = tk.Toplevel(r)
    try:
        window.iconbitmap(resource_path("assets")+"\\favicon.ico") 
    except Exception as e:
        print('icon loading failed')
    window.title('Registered Employee List')
    window.geometry("300x400")
    window.configure(background='white')
    window.resizable(0, 0)
    lb = tk.Label(window, text='Registered Employee List ('+str(len(AllClassesTemp))+')',bd =0, width=25,height=2,font='Helvetica 15 bold', bg ='white', fg='#4cc140') 
    lb.pack()
    frame = VerticalScrolledFrame(window)
    frame.pack(fill=BOTH, expand=1)
    for i in range(len(AllClassesTemp)):
        allemployees.append(Label(frame.interior, font='Helvetica 10 bold', text=str(AllClassesTemp[i])))
        allemployees[-1].pack()

def TextToSpeech(text):
    global engine
    engine.say(text)
    engine.runAndWait()     

class camThread(threading.Thread):
    def __init__(self, previewName, camID):
        threading.Thread.__init__(self)
        self.previewName = previewName
        self.camID = camID
    def run(self):
        print "Starting " + self.previewName
        camPreview(self.previewName, self.camID)

def camPreview(previewName, camID):
    global allFrames,IsCCTVCamRunning,button9,allCCTVCamsUrls
    AllCCTVcams = []
    cv2.namedWindow("CCTVVideo", cv2.WND_PROP_FULLSCREEN)

    # cam = cv2.VideoCapture(camID)
    # if cam.isOpened():  # try to get the first frame
    #     rval, frame = cam.read()
    # else:
    #     rval = False
    print(allCCTVCamsUrls)
    try:
        for i,x in enumerate(allCCTVCamsUrls):
            AllCCTVcams.append(cv2.VideoCapture(x))
        while True:
            # all(x.isOpened() for x in AllCCTVcams)
            # rval, frame = cam.read()
            # # frame = random.random((640,480))
            # frame = cv2.resize(frame, (640, 480))
            # for x in AllCCTVcams:
            #     print(x,x.isOpened())
            if all(x.isOpened() for x in AllCCTVcams):
                for i,v in enumerate(allFrames):
                    if i < len(AllCCTVcams):
                        rval, frame = AllCCTVcams[i].read()
                       
                        # frame = cv2.copyMakeBorder(frame, 5, 0, 5, 0, cv2.BORDER_CONSTANT, value=[0, 0, 0])
                        frame = cv2.resize(frame, (640, 480))
                        allFrames[v] = frame
                try:
                    if(all(allFrames[x].shape[0]==480 for x in allFrames)):
                        # print(allFrames["Camera 6"].shape,allFrames["Camera 5"].shape)
                        vis = np.concatenate([allFrames[v] for v in allFrames][:4], axis=1)
                        vis2 = np.concatenate([allFrames[v] for v in allFrames][4:], axis=1)
                        # print(vis.shape,vis2.shape)
                        vis3 = np.concatenate((vis,vis2),axis=0)        
                        cv2.imshow("CCTVVideo", vis3)
                except Exception as e:
                    print("not all started",e)
            
            key = cv2.waitKey(20)
            if key == 27 or not IsCCTVCamRunning:  # exit on ESC
                break
    except Exception as e:
        print("streams not reachable")
    
    cv2.destroyWindow("CCTVVideo")
    IsCCTVCamRunning = False
    button9["text"] = "Show CCTV"

def StartStopCCTVView():
    global IsCCTVCamRunning,button9,allCCTVCamsUrls,App_Setting,allFrames 
    if IsCCTVCamRunning:
        IsCCTVCamRunning = False
    else:
        allCCTVCamsUrls = []
        CamsUrls = [x.strip() for x in re.split(r"\n",App_Setting["cctvstreams"].strip()) if x]
        for v in CamsUrls:
            try:
                allCCTVCamsUrls.append(int(v.strip()))
            except Exception as e:
                allCCTVCamsUrls.append(v.strip())
        if(len(allCCTVCamsUrls)>0):
            for x in allFrames:
                thisframe =  np.random.randint(255, size=(480,640,3),dtype=np.uint8)
                thisframe = cv2.copyMakeBorder(thisframe, 5, 0, 5, 0, cv2.BORDER_CONSTANT, value=[0, 0, 0])
                thisframe = cv2.resize(thisframe, (640, 480))
                allFrames[x] = thisframe
            IsCCTVCamRunning = True
            thread1 = camThread("Camera 1", 0)
            thread1.start()
    button9["text"] = "Hide CCTV" if IsCCTVCamRunning else "Show CCTV"

def entry_sel_all(event):
        if("select_range" in dir(event.widget)):
            event.widget.select_range(0, END)
            event.widget.icursor(END)
        else:
            event.widget.tag_add(SEL, "1.0", END)
        
        return "break"

def SaveConfig(parent):
    global App_Setting,settingsInput
    updatedSettings = {}
    for x in settingsInput:
        # print(x["label"],x["value"].get().strip())
        try:
            labelvalue = x["value"].get().strip()
        except Exception as e:
            labelvalue = x["value"].get(1.0, END).strip()

        if(x["label"]=="camera_source"):
            try:
                updatedSettings[x["label"]] = int(labelvalue)
            except Exception as e:
                updatedSettings[x["label"]] = labelvalue
        elif(x["label"]=="detection_threshold"):
            try:
                updatedSettings[x["label"]] = float(labelvalue)
            except Exception as e:
                updatedSettings[x["label"]] = labelvalue
        elif(x["label"]=="ispunchin"):
            updatedSettings[x["label"]] = labelvalue in ['True','true', '1', 'y', 'yes']
        else:
            updatedSettings[x["label"]] = labelvalue
    print("updatedSettings")
    print(json.dumps(updatedSettings,sort_keys=True,indent=4, separators=(',', ': ')))
    APPCONFIG = 'app.config'
    default_settings = {} 
    with open(APPCONFIG, 'w') as fid:
        fid.write(json.dumps(updatedSettings,sort_keys=True,indent=4, separators=(',', ': ')))
    LoadSettings()
    parent.destroy()

def ShowConfig():
    global App_Setting,r,settingsInput
    default_settings = App_Setting
    window = tk.Toplevel(r)
    window.title('App settings')
    window.grab_set()
    try:
        window.iconbitmap(resource_path("assets")+"\\favicon.ico") 
    except Exception as e:
        print('icon loading failed')
    settingsInput = []
    for i,v in enumerate(default_settings):
        tk.Label(window, text=v+":",font='Helvetica 9 bold').grid(row=i,column=0,sticky=W,padx=5,pady=5)
        if(v=="cctvstreams"):
            e1 = tk.Text(window,bd =1,width=26,height=5,font='Helvetica 9')
            
        else:
            e1 = tk.Entry(window,bd =1,width=30)
        e1.insert(INSERT, default_settings[v])
        e1.bind("<Control-Key-a>", entry_sel_all)
        e1.grid(row=i, column=1,padx=10,pady=5)
        settingsInput.append({"label":v,"value":e1})
    window.resizable(0, 0)
    buttonsaveConfig = tk.Button(window, text='Save Config',bd =1, width=15,height=2,
        font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=lambda: SaveConfig(window)) 
    buttonsaveConfig.grid(column=1,padx=10,pady=5)

def ShowDailyttendance():
    global r
    global frame2
    global frameBtn

    AttendanceDataFolder = os.path.join(BASE,'face_model_data','AttendanceData')
    datelists = []
    # print(AttendanceDataFolder)
    if(os.path.exists(AttendanceDataFolder)):
        datelists = [x for x in os.listdir(AttendanceDataFolder) if os.path.isdir(os.path.join(AttendanceDataFolder,x))]
        datelists.sort(key=lambda x: os.path.getmtime(os.path.join(AttendanceDataFolder,x)),reverse=True)
    else:
        print('AttendanceDataFolder does not exists!')
    print(datelists)
    window = tk.Toplevel(r)
    window.geometry("450x300")
    window.resizable(0, 0)
    window.config(bg="#fff")
    window.title('Daily Attendance')
    window.grab_set()
    try:
        window.iconbitmap(resource_path("assets")+"\\favicon.ico") 
    except Exception as e:
        print('icon loading failed')
    frameBtn = VerticalScrolledFrame(window)
    tk.Label(window, text="Select Date",font='Helvetica 11 bold', fg ='#4cc140',bg="#fff").pack(anchor=tk.NW,padx=20)
    frameBtn.pack(side=LEFT)
    tk.Button(window, text="export",font='Helvetica 8 bold', bg ='#4cc140',fg="#fff", command=lambda:ExportAttendance(datelists)).place(relx=0.88,rely=0.023)
    frame2 = VerticalScrolledFrame(window)
    tk.Label(window,text="Employee Code     Punchin Time",font='Helvetica 11 bold',bg='#fff',fg='#4cc140').pack(anchor=tk.NW)
    
    for i,v in enumerate(datelists):
        tk.Button(frameBtn.interior,command=lambda i=i:GetAttendanceFromDate(i,datelists,window), 
            text=v,bd =1, width=15,height=2,font='Helvetica 9 bold', 
            fg ='white', bg='#4cc140').grid(row=i,column=0,sticky=W,padx=5)
    if(len(datelists)>0):
        GetAttendanceFromDate(0,datelists,window)


def ShowAttendance(l,window):
    global frame2
    frame2.destroy()
    frame2 = VerticalScrolledFrame(window)
    frame2.pack(fill=BOTH, expand=1)
    frame2.config(bg="white")
    frame2.interior.config(bg="white")
    for i,v in enumerate(l):
        tk.Label(frame2.interior, text=v["empcode"],font='Helvetica 9 bold',bg='#fff').grid(row=i+1,column=0,sticky=W,padx=27,pady=5)
        tk.Label(frame2.interior, text=v["time"],font='Helvetica 9 bold',bg='#fff').grid(row=i+1,column=1,sticky=W,padx=27,pady=5)

def GetAttendanceFromDate(i,datelists,window):
    global frameBtn,clickedAttendanceDate
    clickedAttendanceDate = i
    print("getting attendance from ",datelists[i])
    attendancelists = []
    AttendanceCSVFILE  = os.path.join(BASE,'face_model_data','AttendanceData',datelists[i])
    AttendanceCSVFILE = os.path.join(AttendanceCSVFILE,'attendace.csv') 
    if(os.path.exists(AttendanceCSVFILE)):
        with open(AttendanceCSVFILE, 'rb') as fp:
            reader =  csv.reader(fp)
            for line in reader:
                attendancelists.append({
                    "empcode":line[0],
                    "time":line[1]
                })
    for x,v in enumerate(frameBtn.interior.winfo_children()):
        if(v.winfo_class()=="Button"):
            if x==i:
                v["relief"] = SUNKEN
            else:
                v["relief"] = RAISED
    ShowAttendance(attendancelists,window)
def ExportAttendance(datelists):
    global clickedAttendanceDate
    AttendanceCSVFILE  = os.path.join(BASE,'face_model_data','AttendanceData',datelists[clickedAttendanceDate])
    AttendanceCSVFILE = os.path.join(AttendanceCSVFILE,'attendace.csv')
    if(os.path.exists(AttendanceCSVFILE)):
        file_name = tkFileDialog.asksaveasfilename(initialfile=datelists[clickedAttendanceDate]+"_attendace.csv", 
            title = "Export Attendance File",
            defaultextension=".csv"
            )
        if file_name:
            with open(AttendanceCSVFILE, 'rb') as fp:
                f = open(file_name, 'wb')
                contents = fp.read()
                f.write(contents)
                f.close()
                messagebox.showinfo("Success","file exported successfully at location \n"+file_name)



def OpenUrl():
    demourl = 'https://www.zinghr.com/labs/face-recognition/'
    webbrowser.open_new(demourl)

settingsInput = []
allCCTVCamsUrls=[]
allFrames = {
    "Camera 1":[],
    "Camera 2":[],
    "Camera 3":[],
    "Camera 4":[],
    "Camera 5":[],
    "Camera 6":[],
    "Camera 7":[],
    "Camera 8":[]
    }
IsCCTVCamRunning = False
clf = None
le = preprocessing.LabelEncoder()
BASE = os.path.dirname(os.path.abspath(__file__))
App_Setting = {}
LoadSettings()
# Initialize some variables
faces_dict = {}
known_face_encodings = []
known_face_names = []
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
isStart = False
popupstatus = False
threshold2 = App_Setting['detection_threshold']
frameWidth = 0
LoadingStatus = 'Reload Config'
speak = wincl.Dispatch("SAPI.SpVoice")
voices =  speak.GetVoices()
# print("available voices")
# for v in voices:
#     print(v.GetDescription())
#     if(v.GetDescription().find('Zira') !=-1):
#         speak.Voice = v
speak.Rate = -1
# engine = pyttsx.init()
# voices = engine.getProperty('voices')
# for voice in voices:
#     if(voice.name.find('Zira') !=-1):
#         engine.setProperty('voice', voice.id)
# rate = engine.getProperty('rate')
# engine.setProperty('rate', rate-50)

r = tk.Tk() 
r.title('Face Recogntion System')
r.configure(background='white')
r.geometry("960x570") #You want the size of the app to be 500x500
r.resizable(0, 0) #Don't allow resizing in the x or y direction
print('Welcome, please choose options\n')
label1 = tk.Label(r, text="\nWelcome, please choose options\n")
button1 = tk.Button(r, text='Start Recognition', bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=FaceRecognitionMain) 
button4 = tk.Button(r, text='Stop Recognition', bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=StopCam) 
button2 = tk.Button(r, text='Add New Face', bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140',command=AddNewAction) 
button3 = tk.Button(r, text='Train Existing Model', bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=TrainFace) 
button5 = tk.Button(r, text='Exit', bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=r.destroy) 
button6 = tk.Button(r, text='Save', bd =1, width=10,height=1,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=Save) 
button7 = tk.Button(r, text='Fullscreen Mode',bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=TogglePopUpVideo) 
button8 = tk.Button(r, text='Employee List',bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=ShowRegisteredEmployees) 
button9 = tk.Button(r, text='Show CCTV',bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=StartStopCCTVView) 
button10 = tk.Button(r, text='Show Attendance',bd =1, width=25,height=2,font='Helvetica 9 bold', fg ='white', bg='#4cc140', command=ShowDailyttendance) 

canvas_width = 640
canvas_height = 480
VideoCanvas = tk.Canvas(r, width = canvas_width, height = canvas_height)
# VideoCanvas.create_text(canvas_width / 2,canvas_height / 2,text="Video frames will be shown here")  
bgimg = cv2.resize(np.array(Image.open(resource_path("assets")+"\\face_recognition.jpg")),(canvas_width,canvas_height))
bgphoto = ImageTk.PhotoImage(image = Image.fromarray(bgimg))
VideoCanvas.create_image(0, 0, image = bgphoto,anchor=tk.NW)  
VideoCanvas.pack(side = "right",padx=(0, 40))


img = ImageTk.PhotoImage(Image.open(resource_path("assets")+"\\logo.jpg"))
panel = tk.Label(r,bd =0,bg='white',height=115, image = img)
panel.pack()
# label1.pack() 
button1.pack() 
button4.pack()
button2.pack()
button3.pack()
button7.pack()
button8.pack()
button9.pack()
button10.pack()
button5.pack()

menubar = tk.Menu(r)
filemenu = tk.Menu(menubar, tearoff=0)
filemenu.add_command(label="Exit",command=r.destroy)
menubar.add_cascade(label="File", menu=filemenu)
filemenu = tk.Menu(menubar, tearoff=0)
filemenu.add_command(label="Settings",command=ShowConfig)
menubar.add_cascade(label="Edit", menu=filemenu)
filemenu = tk.Menu(menubar, tearoff=0)
filemenu.add_command(label="Instuctions")
filemenu.add_command(label="About",command=OpenUrl)
menubar.add_cascade(label="Help",menu=filemenu)
r.config(menu=menubar)

L1 = tk.Label(r, text="Enter Employee Code",font='Helvetica 9 bold',bg='white')
E1 = tk.Entry(r, bd =2,width=30)

try:
    r.iconbitmap(resource_path("assets")+"\\favicon.ico") 
except Exception as e:
    print('icon loading failed')
r.mainloop() 
# while(True):
#     print('Welcome, please choose options\n')
#     print('1. Recognition')
#     print('2. Adding new face')
#     print('3. For training')
#     val = raw_input("\nEnter you choice\n")
#     if(val=='1' or val=='2' or val=='3'):
#         break
# if(val=='1'):    
#     FaceRecognitionMain()
# elif(val=='2'):
#     AddNewFace()
# elif(val=='3'):
#     TrainFace()