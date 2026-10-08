import { MOCK_INDIAN_STUDENTS } from './mockStudents';

export const MOCK_INCOMING_REQUESTS = [
  {
    id: 'req_01',
    student: MOCK_INDIAN_STUDENTS[1], // Ananya Verma
    sentAt: '2 hours ago',
    message: 'Hey Alex! I saw your profile and we both prefer quiet study environments and vegetarian food near campus.',
  },
  {
    id: 'req_02',
    student: MOCK_INDIAN_STUDENTS[3], // Priya Sundaram
    sentAt: '1 day ago',
    message: 'Hi! Looking for a flatmate near Christ / DU. Let us connect!',
  },
];

export const MOCK_SENT_REQUESTS = [
  {
    id: 'sent_01',
    student: MOCK_INDIAN_STUDENTS[0], // Aarav Sharma
    status: 'Pending',
    sentAt: 'Yesterday',
  },
  {
    id: 'sent_02',
    student: MOCK_INDIAN_STUDENTS[5], // Sneha Kulkarni
    status: 'Accepted',
    sentAt: '3 days ago',
  },
];

export const MOCK_ACCEPTED_CONNECTIONS = [
  {
    id: 'conn_01',
    student: MOCK_INDIAN_STUDENTS[2], // Rohan Mehta
    connectedSince: 'Sep 2026',
  },
  {
    id: 'conn_02',
    student: MOCK_INDIAN_STUDENTS[4], // Karan Malhotra
    connectedSince: 'Sep 2026',
  },
  {
    id: 'conn_03',
    student: MOCK_INDIAN_STUDENTS[5], // Sneha Kulkarni
    connectedSince: 'Aug 2026',
  },
];

export const MOCK_INITIAL_CONVERSATIONS = [
  {
    id: 'chat_01',
    student: MOCK_INDIAN_STUDENTS[2], // Rohan Mehta
    unreadCount: 2,
    lastMessageTime: '10:45 AM',
    lastMessageText: 'Sounds great! Are you available to visit the Hauz Khas flat this Saturday?',
    messages: [
      {
        id: 'msg_1',
        sender: 'other',
        text: 'Hey Alex! Saw your profile on FlatMate. We both prefer 2 BHK flats near campus.',
        time: 'Yesterday 4:30 PM',
      },
      {
        id: 'msg_2',
        sender: 'me',
        text: 'Hey Rohan! Yeah, I am looking for a quiet place with good Wi-Fi. Have you checked out any listings yet?',
        time: 'Yesterday 5:15 PM',
      },
      {
        id: 'msg_3',
        sender: 'other',
        text: 'Yes! I found a verified 2 BHK near the gate. Rent is ₹14,000 split two ways.',
        time: '10:30 AM',
      },
      {
        id: 'msg_4',
        sender: 'other',
        text: 'Sounds great! Are you available to visit the Hauz Khas flat this Saturday?',
        time: '10:45 AM',
      },
    ],
  },
  {
    id: 'chat_02',
    student: MOCK_INDIAN_STUDENTS[4], // Karan Malhotra
    unreadCount: 0,
    lastMessageTime: 'Yesterday',
    lastMessageText: 'Perfect, let us talk to the landlord tomorrow.',
    messages: [
      {
        id: 'msg_201',
        sender: 'me',
        text: 'Hi Karan, loved the Bandra West listing!',
        time: 'Yesterday 2:00 PM',
      },
      {
        id: 'msg_202',
        sender: 'other',
        text: 'Perfect, let us talk to the landlord tomorrow.',
        time: 'Yesterday 6:20 PM',
      },
    ],
  },
  {
    id: 'chat_03',
    student: MOCK_INDIAN_STUDENTS[5], // Sneha Kulkarni
    unreadCount: 0,
    lastMessageTime: '3 days ago',
    lastMessageText: 'Thanks for connecting! Will keep you posted.',
    messages: [
      {
        id: 'msg_301',
        sender: 'other',
        text: 'Thanks for connecting! Will keep you posted.',
        time: '3 days ago',
      },
    ],
  },
];
