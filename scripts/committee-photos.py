"""Fetch committee portraits from last year's Institute site.

    python scripts/committee-photos.py

Single portraits only, from rotaryinstitute2026srilanka.com — the committee
asked for no couple photographs, which rules out rotaryinstitute2025.com.

Names were matched by hand (the spellings differ: "Mova"/"Movva",
"Choudhary"/"Chowdhury", "Parik"/"Parekh"); the map below is the reviewed
result, keyed by the name as it appears in src/data/committees.js. The four
officers' own portraits, sent by the committee, come from ../photos/photos
with a head-and-shoulders crop each. Writes
public/media/committee/people/<slug>.jpg and src/data/committee-photos.js.
"""
import html
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

from PIL import Image, ImageOps

SITE = 'https://rotaryinstitute2026srilanka.com/committee.php'  # singles, 420x450
OUT = 'public/media/committee/people'
SENT = '../photos/photos/'
CACHE = 'scripts/photo-cache'   # originals of links that refuse scripts, saved through Chrome
GREY = (180, 180, 180)   # the site's portrait background, for cut-outs
WHITE_BG = {'Harish Kumar Gaur'}   # a GIF cut-out with a white fringe; grey shows it

# our name -> (file the committee sent, crop box) — boxes are 10:11, chosen by eye
LOCAL = {
    'Gurjeet Singh Sekhon': (SENT + '01-Convenor-Gurjeet S.Sekhon-single.png', (150, 120, 550, 560)),
    'Basu Dev Golyan': (SENT + '02-Co-Convenor-Basu-dev-Golyan-single.jpeg', (85, 85, 725, 789)),
    'J B Kamdar': (SENT + '03-Chairman - JB Kamdar-single.png', None),
    'Dr Lenny Da Costa': (SENT + '04-Secretary-Dr-Lenny-Da-Costa-single.jpg', (301, 201, 3313, 3514)),
}

# Single portraits found on this machine from earlier Rotary work — the RI Zone
# app's governor thumbnails, the Disha 26 and zone committee pages, and the
# District 3020 directory. Verified single by eye; the RI Zone thumbnails are
# small (130-180px) and will read soft until better copies arrive.
DG = 'D:/Kalpesh/RI ZONE 4 5 6 7/dg-photos/'
DISHA = 'D:/Kalpesh/landing Page/disha26/images/committee/'
ZONE = 'E:/club-website/new_APIS/rotary-frontend/public/images/committee/'
D3020 = "Z:/Feba/Rutu/3020 Printed Directory/Data provided by Usha ma'am for 3020 Directory/"
FOUND = {
    'Sharat Jain': DISHA + 'sharat-jain.png',
    'Elizabeth Cherian': DG + 'Elizabeth-Cherian-Paramesh.jpg',
    'Dr. Bharat Pandya': ZONE + 'bharat-pandya.jpg',
    'Angsuman Bandyopadhyay': ZONE + 'angsuman.jpg',
    'Gajendra Singh Narang': DISHA + 'Gajendra-Narang.png',
    'Jeetendra Aneja': DISHA + 'Jeetendra-Aneja.png',
    'Prabir Chatterjee': ZONE + 'prabir-chatterjee.jpg',
    'J. Karthik': DG + 'j-karthik.jpg',
    'Dr Y Kalyan Chakravarthy': DG + 'dr-y-Kalyan Chakravarthy.jpg',
    'Sharath Choudary Katragadda': DISHA + 'Sharath-Choudary.png',
    'G N Ramesh': DG + 'Dr G N Ramesh.jpg',
    'Raghavendran Chella Krishnan': DG + 'Chella-Raghavendran.jpg',
    'Tina Antoney Kunnumkal': DG + 'Tina Antoney.jpeg',
    'Er. J. Dhinesh Babu': DG + 'Er-Dhinesh-Babu.jpg',
    'Devendran D': DG + 'D-Devendaran.jpg',
    'Amit Jayaswal': DG + 'Amit-jaiswal.jpg',
    'Binod Koirala': DG + 'Binod Koirala.jpg',
    'Amardeep Singh Bunet': DG + 'amardeep.jpg',
    'Gaurish Dhond': DISHA + 'Gaurish-Dhound.png',
    'Subba Rao Ravuri': D3020 + 'dist3020directorydata/PDG Subbarao.jpeg',
    'Harsh Makol': DG + 'Harsh_Makol.png',
    'Nigam Chaudhari': DG + 'Nigam-Chaudhari.jpg',
    'Kishore Kumar CH': D3020 + 'redist3020directorydata/PDG CH Kishore Kumar.jpeg',
    'Rajesh Agarwal': ZONE + 'rajesh-agarwal.jpg',
}
FOUND['Keshav Kunwar'] = 'D:/Kalpesh/e-drive/Kalpesh/project/rotary institute 2025/Team photos for RZI Website/Keshav-Kunwar.jpg'
LOCAL.update({k: (v, None) for k, v in FOUND.items()})

# Links the committee sent, with a head-and-shoulders box each (10:11). The
# rotarynewsonline.org ones refuse anything that is not a browser, so those two
# were saved through Chrome once; the generated files carry them from here.
GIVEN = {
    'Ajeet Jalan': ('https://rizones45678.org/API/Documents/directory/2eda858e-cce9-45b5-b905-6d717cab865b.jpg', (76, 152, 530, 652)),
    'Harish Kumar Gaur': ('https://rotarynewsonline.org/wp-content/uploads/2019/11/Harish-Gaur.gif', (170, 49, 608, 531)),
    'T K Ruby': ('https://rotarynewsonline.org/wp-content/uploads/2018/02/T-K-Ruby.jpg', (103, 57, 481, 473)),
    'Dr Y Kalyan Chakravarthy': ('https://3020.rotaryindia.org/assets/images/dg/3.JPG', (2361, 1118, 4846, 3852)),
    'Naimish Ravani': ('https://lh3.googleusercontent.com/rd-d/ALs6j_EP45kpWW-FMrBXeRsptlbG3Yf6bv3qdpbB7l7k6jSLmgxqt5L_63j8M4RYZVXP8Vbdx9Tjod5m1IbX6ILhwga_h-BWLYWNkXcmQhO_cqSEa462Al2M2dMPBz_OOOSPJ_egaIOX-etdalKOSATQoi-fTFMtdYLTFT4tGXp8o34pg5cqGHNep25Bc74NKwi6aIyIGWSxxYgjpGBttHiFHus8hSFLOXBJ6JYytbO0UZOy19eJEvukqkcJZ44s7rfYLQRH6JvXDPhjtnJxOcZB-TxZclNV4_kM2FvpWFTa_dK6GvyQjuCgYmS_sbvrLSiq_STSGY9XIAwuvuhO3w1lOYciTmOFhdsMegYHUlhsNGNizEahV3RQA5cQyvEBDTyZsJLlW7SyXItM0U5L0_LnO7J0qzuOlYRf1FkfCvUDFHcT4OGj8kK1bPFi1YwGtkullNGw49gjP6RmcZWLDhzqgLm7zTbKIwlgh5cDuw791mpEn_93Cv0vuXoFMZ5M4QMFJuF4e_2opj6aKSyzpEolcgcpP6G5_pU9aUrxFNJSYPM7uxwjTGk3seQ3UmG4YUqrM7e7ERI5W2353aFK5urbt6JC3qG7NRF_LzGkTVEsuyqqfnvwsJ_jYAWhyJh-zRcyw0H91PVwBekhTcV6B5kBFOl6wrC6yN6KhYYLmoLGp6gsUszxnS0QbofmLrCltXkX6jTau8_hiJYMu3wTuyhMdyDg6AoQE79MbMBWCm6OMcECEJYaKxi39uxUX1WpmPoomDNqZ-DCILHLwRSPgl4xEkB13cagKFrrkGh0U7FfHpqzrItviwg6YvImcK2pX4c989vY7iOYtw1g-z42QN92X6MOkysO1NRxsziDECdXWfZesPKDHZd1lsT6qfceMcDU-iHXxylM755giQP9StM8Va31YXHXTpmuHO3x6pROUqbnYq3QWwiI5LE9pkVTGaTkm6Hzc3_yJQ7DzGV_RB9WifCPI8RLyuX-eOFHSuP4yynwnYa1tlWesnR0RjsYxM-_7RNJGEf4mo1rquiZnKCFAQ39zgMUk2rG4kE8YCsy2i5iqGvMHSEAg3JUm45K-saCgWcoftVrZcvrpnDLcevRHxPByzxKyzFIzo7PMSHGPJZgCOeb6SRPS4klGk3YcYU3LhnXrXrclRsBDde-rM6f2Td49i6AfcJHgq99xhi_d1Adl7EHMm_U_Aq4f62uKhEvup-taEIDDS8drVM_su0=w1920-h919', (152, 63, 710, 677)),
}
LOCAL.update(GIVEN)

# The Visakha Vista (Institute 2023) site's committee, faculty and patrons
# folders, which the committee pointed to. All single portraits.
VV = 'Z:/Kalpesh/Project/visakha vista/Visakhavista-new-07/images/'
LOCAL.update({k: (VV + v, None) for k, v in {
    'Anish Shah': 'Patrons/Anish-Shah.jpg',
    'Anu Narang': 'faculty/anu-narang.jpg',
    'Chandra Bob Calidas': 'committee/Chandra-Bob-Calidas.jpg',
    'K Babumon': 'Patrons/Babumon.jpg',
    'Kandukuri Sreerama Murthy': 'Patrons/Kandukuri-Murthy-Sreerama.jpg',
    'Krishnan Nair': 'Patrons/Krishnannair.jpg',
    'M K Ravindra': 'Patrons/M.K.Ravindra.jpg',
    'Madhav Chandran': 'faculty/Madhav-Chandran.jpg',
    'Malla Venkateshwara Rao': 'Patrons/Venkateshwara-Rao.jpg',
    'Rajiv Sharma': 'Patrons/Rajiv-Sharma.jpg',
    'Rajyalaxmi Vadlamani': 'faculty/rajyalakshmi-vadlamani.jpg',
    'S Balaji': 'Patrons/S.Balaji.jpg',
    'Sandeep Narang': 'faculty/sandeep-narang.jpg',
    'Sangram Patil': 'faculty/sangram-patil.jpg',
    'Subhash Jain': 'Patrons/Subhash-Jain.jpg',
    'Veerabhadra Reddy': 'Patrons/Veerabhadra-Reddy.jpg',
    'Surinder Pal Singh Grover': 'getsgents/sps-grover.jpg',
    'Sambasiva Rao Patibandla': 'committee/Sam Patibandla.jpeg',
}.items()})

# Files the committee pointed to on this machine.
TEAM = 'E:/Kalpesh/github-project/RotaryIndia_New/TouchBaseWebSite/assets/images/team/'
LOCAL.update({
    'Kalyan Banerjee': (TEAM + 'team_8.png', None),
    'T N Subramanian': (TEAM + 'Subramanian.webp', None),
    'Anirudha Roy Chowdhury': ('Z:/Kalpesh/anirudh/Arc1212.jpg', (0, 20, 900, 1010)),
})

# Second batch from the committee, September 2026: files on this machine and
# two links. Boxes are 10:11 head-and-shoulders, chosen by eye.
DL = 'C:/Users/Kalpesh/Downloads/'
LOCAL.update({
    'Dr Ravindra Gugnani': (DL + 'IMG_ (714).JPG', (439, 63, 898, 568)),
    'Raja Saboo': (DL + 'Raja Saboo.png', None),
    'Vijay Shetty': ('https://rizones45678.org/API/Documents/directory/IMG_761730122020032208PM.jpg', (226, 50, 527, 381)),
    'Pawan Agarwal': ('https://rotarynewsonline.org/wp-content/uploads/2022/10/New-Photos-10.jpg', (87, 0, 814, 800)),
    'Vidhya Subramanian': ('F:/Raju and Vidhya/WhatsApp Image 2026-09-15 at 6.33.07 PM (2).jpeg', (250, 0, 870, 682)),
    'Pravudutta Subudhi': (DL + 'Pravudutta-Subudhi.jpg', None),
    'Chinniah Senthil Kumar': (DL + 'Zone 5 Dist 2982 C Senthil Kumar.jpeg', None),
    'Shriram Duvvuri': ('https://rizones45678.org/API/Documents/directory/7e7327e4-145d-4450-804b-b97a3a3024fc.jpeg', (224, 0, 704, 529)),
    'Tushar Shah': ('https://rotarynewsonline.org/wp-content/uploads/2024/10/Tushar-Shah2.jpg', (91, 0, 776, 753)),
    'Sanjay Khanna': ('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDtZez8rjGHur6vjs-bBF1IoEcoz2EqqXBVb2lVNaN2PCw6VR0jdiyTJ_B&s=10', (44, 44, 326, 355)),
    # a two-person photograph; Ram Prasad is the one on the right
    'Ram Prasad': (DL + '504988481_10236134388769299_8091060911645350874_n.jpg', (625, 55, 1055, 528)),
    'Dhiran Datta': ('https://rotarynewsonline.org/wp-content/uploads/2019/11/Dhiran-Datta.jpg', (150, 0, 682, 586)),
    'Kumud Golyan': (DL + 'IMG_0187.JPG', (778, 389, 2765, 2575)),   # box is on the upright picture
    'Mahesh Trikha': ('https://static.virtubox.io/project/file/20220913-055414-vqbv-img_1658.jpg', None),
    'Chetan Desai': ('https://rotarynewsonline.org/wp-content/uploads/2024/08/Chetan-Desai.jpg', (49, 0, 776, 800)),
    'Kishore Rathi': (DL + 'Kishore Vitthaldas Rathi.jpeg', None),
    'Thansen': (DL + '752524893_17909600343443342_8990104047960177018_n.jpg', (312, 335, 768, 837)),   # a poster; the box is his photograph in it
    'Uday Pilani': (DL + 'Uday Pilani.jpeg', (100, 0, 390, 319)),
    'Major Deepak Mehta': ('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlqitoWRsxJmFi8ddp2GghfHzOj278_nePpy0qUepUvw&s=10', None),
    'Neerav Nimesh Agrawal': ('https://rotarynewsonline.org/wp-content/uploads/2024/09/Neerav-Agarwal.jpg', (137, 0, 864, 800)),
    # a two-person photograph; Deepak Pophale is the one on the right
    'Deepak P Pophale': (DL + 'RID 3132, Deepak Pophale.jpeg', (800, 0, 1387, 645)),
    'Kishore Khatru': (DL + '65835066_1189975047877857_4384431361696464896_n.jpg', None),
    'Manjoo Phadke': (DL + 'Manjoo-Phadke.jpg', (112, 0, 839, 800)),
    'Shailesh Palekar': (DL + 'PDG-Dr-Shailesh-Palekar.jpg', None),
    'Amjad Ali': ('https://i0.wp.com/hellomumbainews.com/wp-content/uploads/2020/10/IMG-20200929-WA0037.jpg', (85, 374, 641, 985)),
    'Vikrant V Kadam': ('https://rizones45678.org/API/Documents/directory/Screenshot_20220507-161839_Gallery_114042026115151AM.png', None),
    'Rohit Oberoi': ('https://rotarynewsonline.org/wp-content/uploads/2025/09/Rohit-Oberoi-1024x724.jpg', (200, 0, 858, 724)),
    'Rajinder Khurana': ('https://rid3030districtawards.indiaopd.com/Images/RSK.jpg', None),
    'Subramani Ramanujam': ('https://rizones45678.org/API/Documents/directory/37f2ee18-68f0-4e15-8bc4-68325f0fa472.png', None),
    'Sanjeev Thakur': ('https://rotarynewsonline.org/wp-content/uploads/2023/01/3250-Sanjeev-Thakur-2022-23.jpg', None),
    # a Times of India (BCCL) picture; the box stops above its copyright line
    'Dattatraya S. Deshmukh': ('https://static.toiimg.com/thumb.cms?msid=39164584&height=600&width=600', (38, 0, 418, 418)),
    'P. Sivasundaram': ('https://rotarynewsonline.org/wp-content/uploads/2025/08/IMG_2747-1024x683.jpg', (150, 0, 771, 683)),
    'Amita Mohindru': ('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNmW_HiFt3VtySDECaS_sBK_KBDP2SXuuAvYOnB4VzFyag4mhQmNNgDRg&s=10', (50, 19, 261, 252)),
    'Vijay Arora': ('https://rotarynewsonline.org/wp-content/uploads/2020/09/49660821-0878-4cbb-b07f-331346fa808e.jpg', (102, 0, 647, 600)),
    'Nitin Kumar Agarwal': (DL + '499538816_10238058442185255_7878537680347897046_n.jpg', (597, 0, 1536, 1033)),
    'Prakash N Karanth': (DL + '229791255_2981565545496437_515859889304746751_n.jpg', (74, 30, 788, 814)),
    # a couple photograph; Upinder Singh Ghai is the one on the left
    'Upinder Singh Ghai': (DL + 'Dr.-Upinder-Singh-Ghai.jpg', (73, 0, 240, 184)),
    'Rajen Vidhyarthi': ('https://rizones45678.org/API/Documents/directory/22082023030540PM.png', (220, 49, 1344, 1285)),
    'Dr. Ashutosh Agrawal': ('https://rotaryclubofvaranasinorth.com/wp-content/uploads/2025/06/4.jpg', (105, 0, 948, 927)),
    'Anil Parmar': ('https://rotarynewsonline.org/wp-content/uploads/2022/12/Anil-Parmar.jpg', (137, 0, 864, 800)),
    'Sudhir Lature': (DL + 'Sudheer V Lature.png', (116, 0, 531, 457)),
    'Sharad Pai': (DL + '489767454_9637931009562859_1410938392069125806_n.jpg', (162, 0, 1201, 1143)),
    'Nasir H. Borsadwala': ('https://rotarynewsonline.org/wp-content/uploads/2024/01/NASIR-BORSADWALA.jpg', None),
    'Ramkrishna P K': (DL + 'Ramkrishna P.png', (30, 0, 250, 242)),
    # a couple photograph; Udaykumar Bhaskara is the one on the left
    'Udaykumar K Bhaskara': (DL + 'Mr.-Udaykumar-K.-Bhaskara.jpg', (79, 30, 269, 239)),
    'Mahadeva Prasad': ('https://rotarynewsonline.org/wp-content/uploads/2024/11/Mahadev-Prasad.jpg', None),
    'Dr Kameshwar Elangbam': (DL + '624606980_18092976514822300_8418155952846985592_n.jpg', (76, 0, 480, 444)),
    # a couple photograph (a JPEG with no extension); Sharat Chandra is on the right
    'Sharat Chandra': (DL + '34. PDG Sharat Chandra & Anjana - Zonal Promotion Chair', (1920, 1248, 2976, 2410)),
    'Sandeep Chauhan': ('https://aasthakidney.com/img/sandeepchauhan.jpg', (1536, 307, 2253, 1096)),
    'Jitendra Bahadur Rajbhandary': (DL + 'Jitendra B. Rajbhandary.jpg', None),
    'Nisha Shekhawat': ('https://rotarynewsonline.org/wp-content/uploads/2025/12/Nisha-Shekhawat-1024x981.jpg', (100, 0, 920, 902)),
    'Sivagnanaselvam Chinnaiyan': (DL + 'Sivagnanaselvam Chinnaiyan.png', (0, 0, 555, 610)),
})

# The RI Zones member directory (rizones45678.org/API, /api/Members search),
# matched by name and district against the workbook. Paths are the API's own
# profilePhotoPath. Ten more matches there were under 100px and left out.
RIZ = 'https://rizones45678.org/API'
LOCAL.update({k: (RIZ + v, b) for k, (v, b) in {
    'Amandeep Sekhon': ('/Documents/directory/Amandeep10072024075415AM.png', None),
    # Jayant G. Kulkarni: the directory copy (171x158) was too blurred to use; awaiting a photograph
    'Rajarama B. Bhat': ('/Documents/directory/508112019060017PM.bmp', None),
    'Ghanshayam Kansal': ('/Documents/directory/Ghanshyam-Kansal208052026063309PM.jpg', None),
    'Lalit Khanna': ('/Documents/directory/ddd04112024125250PM.PNG', None),
    'Sushil Malhotra': ('/Documents/directory/2C5171B6-5A70-420D-8F7D-1B81D748836013052024011144PM.jpeg', (92, 100, 475, 522)),
    'Ved Parkash Kalta': ('/Documents/directory/8869227e-b48e-4017-a010-2ee2672177eb.png', None),
    'Dinesh Mehta': ('/Documents/directory/e82474c8-e14a-404c-877f-c0754a95ad39.jpg', None),
    'Dev Anand': ('/Documents/directory/Devanand04082024054024PM.jpeg', None),
    'Sethu Shiv Sankar': ('/Documents/directory/10._PDG_Dr._Sethu_Shiv_Shankar18062025015209PM.jpg', None),
    'Manoj Kumar Tripathy': ('/Documents/directory/MEMBER1043128_240720260216552096430PM.png', None),
    'Jhulan Basu': ('/Documents/directory/FB_IMG_173713586334917012025111501PM.jpg', None),
    'Sharon Dias': ('/Documents/directory/07092023112539AM.png', None),
    'Vinay Bhatia': ('/Documents/directory/106112019114513AM.bmp', None),
    'Pradeep Mukherjee': ('/Documents/directory/2407112019115906AM.bmp', None),
    'Pratim Banerjee': ('/Documents/directory/12052020091212AM.png', None),
    'Rajan Gandotra': ('/Documents/directory/1205112019115224AM.bmp', None),
    'Surendra Reddy Bommireddy': ('/Documents/directory/a1d86274-c9d3-4786-b248-f5de1f01c6ea.jpg', None),
    'Satpal Gulati': ('/Documents/directory/4007112019123308PM.bmp', None),
    'Bharath Kumar Reddy Dodla': ('/Documents/directory/15052022103816AM.png', None),
    'Arun Bagadia': ('/Documents/directory/b2e70c7d-c9ca-46ff-af97-f61f933e8b96.png', (28, 0, 326, 328)),
    'Pawan Kumar Khandelwal': ('/Documents/directory/21122021025825PM.png', None),
    'Sanjay Malviya': ('/Documents/directory/12102020114023AM.png', None),
    'Ashes Ganguly': ('/Documents/directory/3908112019024622PM.bmp', None),
    'Rajani Mukerji': ('/Documents/directory/8801112019061624PM.bmp', None),
    'Rita Kalra': ('/Documents/directory/ea492aec-bed3-4b97-a724-732050a5d69e.png', None),
    'Nirmal Jain Kunawat': ('/Documents/directory/7AD0ED05-4A27-453B-9AFB-775F4699E43115042024124512PM.jpeg', (160, 253, 747, 899)),
    'Nirmal Kumar Singhvi': ('/Documents/directory/306112019031353PM.bmp', None),
    'Dr. Jayprakash S. Vyas': ('/Documents/directory/306112019031016PM.bmp', None),
    'Vasudev Malladi': ('/Documents/directory/508112019061841PM.bmp', None),
    'Vishnu B Karkee': ('/Documents/directory/WhatsApp_Image_2024-02-23_at_11.18.49_AM23022024112807AM.jpeg', None),
    'Rajesh Rajan': ('/Documents/directory/04072020103023PM.png', None),
    'Dr. Gulshan K. Thakral': ('/Documents/directory/GK_Thakkar0113082025115809AM.jpeg', None),
    'Narasimhan Subramanian': ('/Documents/directory/1306112019112758AM.bmp', None),
    'Mukesh Arneja': ('/Documents/directory/06092020084123AM.png', None),
    'Dr. Santhosh Sreedhar': ('/Documents/directory/17_Rtn._PP_MD_Dr._Santhosh_Sreedhar26062024021730PM.jpeg', None),
    'Harjit Singh Talwar': ('/Documents/directory/2408112019022203PM.bmp', None),
    'Kranti Chandra Mehta': ('/Documents/directory/306112019043649PM.bmp', None),
    'Parminder Singh Grover': ('/Documents/directory/04062023113841AM.png', (1394, 0, 3741, 2582)),
}.items()})

# Same directory, found by the mobile number or e-mail in the workbook where
# the name there is spelt differently (Avinash Potdar, Flory Fernandes e
# Gracias, Gopinath Ramarathnam, Raaj Xete Khalap ...).
LOCAL.update({k: (RIZ + v, b) for k, (v, b) in {
    'Prashant Jani': ('/Documents/directory/506112019104758AM.bmp', None),
    'Flory Gracious': ('/Documents/directory/18092023123305PM.png', None),
    'Avinash Poddar': ('/Documents/directory/RTNAVINASHPOTDARBELGAUM14042026104134PM.jpeg', None),
    'Ravi Shankar': ('/Documents/directory/P._RAVISHANKAR28032024034332PM.jpeg', None),
    'K Gopinath': ('/Documents/directory/28062021085156AM.png', None),
    'Dr. Vinaykumar Pai Raikar': ('/Documents/directory/2509112019025036PM.bmp', None),
    'Ajay Menon': ('/Documents/directory/0e30aeb4-32c1-4594-b048-71a95b8e535809042026075747PM.jpeg', None),
    'Raj Khalap': ('/Documents/directory/1bdcfc8e-fcba-4db6-9631-f7ca19b657c006072025011959PM.jpeg', None),
    'Mohan Palesha': ('/Documents/directory/707112019032455PM.bmp', None),
    'Amit Gupta': ('/Documents/directory/GOVERNOR130920250425369791461PM.png', None),
    'Nagendra B L Prasad': ('/Documents/directory/709112019024023PM.bmp', None),
    'Vipul Patel': ('/Documents/directory/WhatsApp_Image_2026-03-06_at_13.57.27_(1)06032026035356PM.jpeg', (0, 30, 320, 382)),
    'Prafull Sharma': ('/Documents/directory/2008112019021615PM.bmp', None),
    'Deepak Purohit': ('/Documents/directory/WhatsApp_Image_2025-07-29_at_15.04.41_(1)30072025065941AM.jpeg', (98, 0, 384, 315)),
    'Jorson Fernandes': ('/Documents/directory/1709112019023552PM.bmp', None),
    'Bansidhar S Dhurandhar': ('/Documents/directory/308112019122524PM.bmp', None),
}.items()})

# our name -> name as the site spells it
PHOTOS = {
    # Core Team
    'Dr Sharat Babu Chilukuri': 'Dr. Sharat Babu',
    'Amritha Gowri Rajan': 'Gowri Rajan',
    'Ashish Ajmera': 'Ashish Ajmera',
    'Sridhar Jagannathan': 'J. Shridhar',
    'Venkata Mohana Prasad': 'Dr. G V Mohan Prasad',
    'Asha Venugopal': 'Asha Venugopal',
    'K R Ravindran': 'PRIP K.R. Ravindran',
    # the rest
    'Sam Movva': 'Sam Mova',
    'Sunil K. Zachariah': 'Sunil Zachariah',
    'Jawahar Vadlamani': 'Jawahar Vadlamani',
    'Abhindandan Shetty': 'Abhinandan A Shetty',
    'Jitendra Dhingra': 'Jitendra Dhingra',
    'Pramod Parekh': 'Pramod Shashikant Parik',
    'Aruni Malalasekera': 'Aruni Malalasekara',
    'Lakkaraju Satyanarain': 'Lakkaraju Satyanarain',
    'Dr. Dushyant Chowdhury': 'Dr. Dushyant Choudhary',
    'Dr. Chandrashekhar Kolvekar': 'Dr.Chandrashekhar Kolvekar',
    'Raman Aneja': 'Raman Aneja',
    'Dr. Nandakumar': 'Dr. N. Nandakumar',
    'Ganesh Bhat': 'Ganesh Bhat',
    'Dnyaneshwar Shewale': 'Dnyaneshwar Shewale',
    'Dr. Raakhi Gupta': 'Raakhi Gupta',
    'B Dhanasekar': 'B. Dhanasekar',
    'Sushena Ranathunga': 'Sushena Ranatunga',
    'Ravi Raman': 'Ravi Raman',
    'A Venkatachalapathy': 'A. Venkatachalapathy',
    'Zameer Pasha': 'Dr. A. Zameer Pasha',
    'Sanjay Khemka': 'Sanjay Khemka',
    'Prashant Raj Sharma': 'Prashant Raj Sharma',
    'Dr. John Daniel': 'John Daniel',
    'Muthu Palaniappan': 'S. Muthupalaniappan',
    'Manjunath Shetty': 'Manjunath Shetty',
    'Ashok Kantoor': 'Ashok Kantoor',
    'Rahul Shrivastava': 'Rahul Shrivastava',
    'Ajay Gupta': 'Ajay Gupta',
    'Dr Krishnendu Gupta': 'Dr. Krishnendu Gupta',
    'Manjit Singh Arora': 'Manjit Singh Arora',
    'Kailash Jethani': 'Kailash Jethani',
    'Ashok Bihari Mahapatra': 'Ashok B. Mohapatra',
    'Pinky S Patel': 'Pinky Patel',
    'A Karthikeyan': 'A. Karthikeyan',
    'Narendra Rao': 'Narendra Rao',
    'Sunil Nagpal': 'Sunil Nagpal',
    'Mahmood Fazal': 'Fazal Mahmood',
    'Shashank Rastogi': 'Shashank Rastogi',
    'Jerome Rajendram': 'Jerome Rajendram',
    'Shashi Sharma': 'Shashi Sharma',
    'Dr. Rajesh Subhash': 'Dr. Rajesh Subash',
    'Pubudu de Zoysa': 'Pubudu de Zoysa',
    'I Jerald': 'I Jerald',
    'Praveen Goyal': 'Praveen Chander Goyal',
    'Keshav H R': 'Keshav H R',
    'Pankaj Shah': 'Pankaj Arun Shah',
    'R V N Kannan': 'R.V.N. Kannan',
    'Debashish Das': 'Dr. Debashish Das',
    'Anandtha Jothi': 'Anandtha Jothi',
    'Mehul Rathod': 'Mehul Rathod',
}


def fetch(url, tries=4):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    for i in range(tries):
        try:
            return urllib.request.urlopen(req, timeout=60).read()
        except OSError:
            if i == tries - 1:
                raise
            time.sleep(2 * (i + 1))   # the host drops a burst of requests


def cards(page):
    out = {}
    for src, n in re.findall(r'<img src="(assets/waves-img/team/[^"]+)"[^>]*>.*?<h5[^>]*>(.*?)</h5>', page, re.S):
        url = 'https://rotaryinstitute2026srilanka.com/' + urllib.parse.quote(html.unescape(src))
        out.setdefault(html.unescape(re.sub('<[^>]+>', '', n)).strip(), url)
    return out


def slug(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')


def frame(im):
    """Fit a portrait into the 10:11 frame without cutting the head: fill it
    by trimming width from both sides, or height from the bottom only — never
    from the top. Nothing is added; the picture is shown as it came."""
    w, h = im.size
    th = round(w * 1.1)
    if h > th:
        im = im.crop((0, 0, w, th))
    elif h < th:
        tw = round(h / 1.1)
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    return im.resize((500, 550), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    src = cards(fetch(SITE).decode('utf-8', 'ignore'))
    paths = {}
    for ours in list(LOCAL) + list(PHOTOS):
        rel = f'/media/committee/people/{slug(ours)}.jpg'
        paths[ours] = rel
        if os.path.exists('public' + rel):
            continue
        box = None
        if ours in LOCAL:
            path, box = LOCAL[ours]
            cached = [f for f in os.listdir(CACHE) if f.rsplit('.', 1)[0] == slug(ours)]
            try:
                if cached:
                    im = Image.open(os.path.join(CACHE, cached[0]))
                else:
                    im = Image.open(io.BytesIO(fetch(path)) if path.startswith('http') else path)
            except OSError as e:
                print('NOT FETCHED:', ours, e, file=sys.stderr)
                del paths[ours]
                continue
            im = ImageOps.exif_transpose(im)   # camera files carry their rotation in EXIF
            if box:
                im = im.crop(box)
        else:
            url = src.get(PHOTOS[ours])
            if not url:
                print('NOT FOUND:', PHOTOS[ours], file=sys.stderr)
                del paths[ours]
                continue
            im = Image.open(io.BytesIO(fetch(url)))
        im = im.convert('RGBA')
        flat = Image.new('RGB', im.size, (255, 255, 255) if ours in WHITE_BG else GREY)   # a few portraits are cut-outs
        flat.paste(im, mask=im.getchannel('A'))
        im = flat
        im = frame(im)
        im.save('public' + rel, quality=86, optimize=True)
    body = ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in sorted(paths.items()))
    with open('src/data/committee-photos.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* GENERATED by scripts/committee-photos.py, which says where each\n'
                ' * photograph came from. Keyed by the name in committees.js. */\n'
                'export const committeePhotos = {\n' + body + ',\n}\n')
    print(len(paths), 'photographs')


if __name__ == '__main__':
    main()
