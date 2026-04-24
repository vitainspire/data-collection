// All Indian states/UTs with their districts.
// Codes for districts are computed at module load to be unique within a state.

interface RawState {
  code: string;
  name: string;
  districts: string[];
}

const RAW_STATES: RawState[] = [
  {
    code: "AP",
    name: "Andhra Pradesh",
    districts: [
      "Alluri Sitharama Raju","Anakapalli","Anantapur","Annamayya","Bapatla","Chittoor",
      "Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna",
      "Kurnool","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Prakasam",
      "Sri Potti Sriramulu Nellore","Sri Sathya Sai","Srikakulam","Tirupati","Visakhapatnam",
      "Vizianagaram","West Godavari","YSR Kadapa",
    ],
  },
  {
    code: "AR",
    name: "Arunachal Pradesh",
    districts: [
      "Anjaw","Changlang","Dibang Valley","East Kameng","East Siang","Itanagar Capital Complex",
      "Kamle","Kra Daadi","Kurung Kumey","Lepa Rada","Lohit","Longding","Lower Dibang Valley",
      "Lower Siang","Lower Subansiri","Namsai","Pakke Kessang","Papum Pare","Shi Yomi","Siang",
      "Tawang","Tirap","Upper Siang","Upper Subansiri","West Kameng","West Siang",
    ],
  },
  {
    code: "AS",
    name: "Assam",
    districts: [
      "Bajali","Baksa","Barpeta","Biswanath","Bongaigaon","Cachar","Charaideo","Chirang",
      "Darrang","Dhemaji","Dhubri","Dibrugarh","Dima Hasao","Goalpara","Golaghat","Hailakandi",
      "Hojai","Jorhat","Kamrup","Kamrup Metropolitan","Karbi Anglong","Karimganj","Kokrajhar",
      "Lakhimpur","Majuli","Morigaon","Nagaon","Nalbari","Sivasagar","Sonitpur",
      "South Salmara-Mankachar","Tamulpur","Tinsukia","Udalguri","West Karbi Anglong",
    ],
  },
  {
    code: "BR",
    name: "Bihar",
    districts: [
      "Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar",
      "Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar",
      "Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur",
      "Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura",
      "Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran",
    ],
  },
  {
    code: "CG",
    name: "Chhattisgarh",
    districts: [
      "Balod","Baloda Bazar","Balrampur","Bastar","Bemetara","Bijapur","Bilaspur","Dantewada",
      "Dhamtari","Durg","Gariaband","Gaurela-Pendra-Marwahi","Janjgir-Champa","Jashpur",
      "Kabirdham","Kanker","Khairagarh-Chhuikhadan-Gandai","Kondagaon","Korba","Koriya",
      "Mahasamund","Manendragarh-Chirmiri-Bharatpur","Mohla-Manpur-Ambagarh Chowki","Mungeli",
      "Narayanpur","Raigarh","Raipur","Rajnandgaon","Sakti","Sarangarh-Bilaigarh","Sukma",
      "Surajpur","Surguja",
    ],
  },
  { code: "GA", name: "Goa", districts: ["North Goa","South Goa"] },
  {
    code: "GJ",
    name: "Gujarat",
    districts: [
      "Ahmedabad","Amreli","Anand","Aravalli","Banaskantha","Bharuch","Bhavnagar","Botad",
      "Chhota Udaipur","Dahod","Dang","Devbhoomi Dwarka","Gandhinagar","Gir Somnath","Jamnagar",
      "Junagadh","Kheda","Kutch","Mahisagar","Mehsana","Morbi","Narmada","Navsari","Panchmahal",
      "Patan","Porbandar","Rajkot","Sabarkantha","Surat","Surendranagar","Tapi","Vadodara","Valsad",
    ],
  },
  {
    code: "HR",
    name: "Haryana",
    districts: [
      "Ambala","Bhiwani","Charkhi Dadri","Faridabad","Fatehabad","Gurugram","Hisar","Jhajjar",
      "Jind","Kaithal","Karnal","Kurukshetra","Mahendragarh","Nuh","Palwal","Panchkula","Panipat",
      "Rewari","Rohtak","Sirsa","Sonipat","Yamunanagar",
    ],
  },
  {
    code: "HP",
    name: "Himachal Pradesh",
    districts: [
      "Bilaspur","Chamba","Hamirpur","Kangra","Kinnaur","Kullu","Lahaul and Spiti","Mandi",
      "Shimla","Sirmaur","Solan","Una",
    ],
  },
  {
    code: "JH",
    name: "Jharkhand",
    districts: [
      "Bokaro","Chatra","Deoghar","Dhanbad","Dumka","East Singhbhum","Garhwa","Giridih","Godda",
      "Gumla","Hazaribagh","Jamtara","Khunti","Koderma","Latehar","Lohardaga","Pakur","Palamu",
      "Ramgarh","Ranchi","Sahebganj","Seraikela Kharsawan","Simdega","West Singhbhum",
    ],
  },
  {
    code: "KA",
    name: "Karnataka",
    districts: [
      "Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban","Bidar",
      "Chamarajanagar","Chikballapur","Chikkamagaluru","Chitradurga","Dakshina Kannada",
      "Davanagere","Dharwad","Gadag","Hassan","Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
      "Mandya","Mysuru","Raichur","Ramanagara","Shivamogga","Tumakuru","Udupi","Uttara Kannada",
      "Vijayanagara","Vijayapura","Yadgir",
    ],
  },
  {
    code: "KL",
    name: "Kerala",
    districts: [
      "Alappuzha","Ernakulam","Idukki","Kannur","Kasaragod","Kollam","Kottayam","Kozhikode",
      "Malappuram","Palakkad","Pathanamthitta","Thiruvananthapuram","Thrissur","Wayanad",
    ],
  },
  {
    code: "MP",
    name: "Madhya Pradesh",
    districts: [
      "Agar Malwa","Alirajpur","Anuppur","Ashoknagar","Balaghat","Barwani","Betul","Bhind",
      "Bhopal","Burhanpur","Chhatarpur","Chhindwara","Damoh","Datia","Dewas","Dhar","Dindori",
      "Guna","Gwalior","Harda","Indore","Jabalpur","Jhabua","Katni","Khandwa","Khargone","Maihar",
      "Mandla","Mandsaur","Mauganj","Morena","Narmadapuram","Narsinghpur","Neemuch","Niwari",
      "Pandhurna","Panna","Raisen","Rajgarh","Ratlam","Rewa","Sagar","Satna","Sehore","Seoni",
      "Shahdol","Shajapur","Sheopur","Shivpuri","Sidhi","Singrauli","Tikamgarh","Ujjain","Umaria",
      "Vidisha",
    ],
  },
  {
    code: "MH",
    name: "Maharashtra",
    districts: [
      "Ahmednagar","Akola","Amravati","Chhatrapati Sambhajinagar","Beed","Bhandara","Buldhana",
      "Chandrapur","Dharashiv","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna",
      "Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik",
      "Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur",
      "Thane","Wardha","Washim","Yavatmal",
    ],
  },
  {
    code: "MN",
    name: "Manipur",
    districts: [
      "Bishnupur","Chandel","Churachandpur","Imphal East","Imphal West","Jiribam","Kakching",
      "Kamjong","Kangpokpi","Noney","Pherzawl","Senapati","Tamenglong","Tengnoupal","Thoubal","Ukhrul",
    ],
  },
  {
    code: "ML",
    name: "Meghalaya",
    districts: [
      "East Garo Hills","East Jaintia Hills","East Khasi Hills","Eastern West Khasi Hills",
      "North Garo Hills","Ri Bhoi","South Garo Hills","South West Garo Hills",
      "South West Khasi Hills","West Garo Hills","West Jaintia Hills","West Khasi Hills",
    ],
  },
  {
    code: "MZ",
    name: "Mizoram",
    districts: [
      "Aizawl","Champhai","Hnahthial","Khawzawl","Kolasib","Lawngtlai","Lunglei","Mamit","Saiha",
      "Saitual","Serchhip",
    ],
  },
  {
    code: "NL",
    name: "Nagaland",
    districts: [
      "Chumukedima","Dimapur","Kiphire","Kohima","Longleng","Mokokchung","Mon","Niuland","Noklak",
      "Peren","Phek","Shamator","Tseminyu","Tuensang","Wokha","Zunheboto",
    ],
  },
  {
    code: "OD",
    name: "Odisha",
    districts: [
      "Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh","Dhenkanal",
      "Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi","Kandhamal",
      "Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj","Nabarangpur",
      "Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh",
    ],
  },
  {
    code: "PB",
    name: "Punjab",
    districts: [
      "Amritsar","Barnala","Bathinda","Faridkot","Fatehgarh Sahib","Fazilka","Ferozepur",
      "Gurdaspur","Hoshiarpur","Jalandhar","Kapurthala","Ludhiana","Malerkotla","Mansa","Moga",
      "Muktsar","Pathankot","Patiala","Rupnagar","Sahibzada Ajit Singh Nagar","Sangrur",
      "Shaheed Bhagat Singh Nagar","Tarn Taran",
    ],
  },
  {
    code: "RJ",
    name: "Rajasthan",
    districts: [
      "Ajmer","Alwar","Anupgarh","Balotra","Banswara","Baran","Barmer","Beawar","Bharatpur",
      "Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Deeg","Dholpur",
      "Didwana-Kuchaman","Dudu","Dungarpur","Ganganagar","Gangapur City","Hanumangarh","Jaipur",
      "Jaipur Rural","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Jodhpur Rural",
      "Karauli","Kekri","Khairthal-Tijara","Kota","Kotputli-Behror","Nagaur","Neem-ka-Thana",
      "Pali","Phalodi","Pratapgarh","Rajsamand","Salumbar","Sanchore","Sawai Madhopur","Shahpura",
      "Sikar","Sirohi","Tonk","Udaipur",
    ],
  },
  {
    code: "SK",
    name: "Sikkim",
    districts: ["Gangtok","Gyalshing","Mangan","Namchi","Pakyong","Soreng"],
  },
  {
    code: "TN",
    name: "Tamil Nadu",
    districts: [
      "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode",
      "Kallakurichi","Kanchipuram","Kanyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai",
      "Nagapattinam","Namakkal","Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet",
      "Salem","Sivaganga","Tenkasi","Thanjavur","Theni","Thoothukudi","Tiruchirappalli",
      "Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore",
      "Viluppuram","Virudhunagar",
    ],
  },
  {
    code: "TS",
    name: "Telangana",
    districts: [
      "Adilabad","Bhadradri Kothagudem","Hanumakonda","Hyderabad","Jagtial","Jangaon",
      "Jayashankar Bhupalpally","Jogulamba Gadwal","Kamareddy","Karimnagar","Khammam",
      "Komaram Bheem","Mahabubabad","Mahabubnagar","Mancherial","Medak","Medchal-Malkajgiri",
      "Mulugu","Nagarkurnool","Nalgonda","Narayanpet","Nirmal","Nizamabad","Peddapalli",
      "Rajanna Sircilla","Rangareddy","Sangareddy","Siddipet","Suryapet","Vikarabad","Wanaparthy",
      "Warangal","Yadadri Bhuvanagiri",
    ],
  },
  {
    code: "TR",
    name: "Tripura",
    districts: [
      "Dhalai","Gomati","Khowai","North Tripura","Sepahijala","South Tripura","Unakoti",
      "West Tripura",
    ],
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    districts: [
      "Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat",
      "Bahraich","Ballia","Balrampur","Banda","Barabanki","Bareilly","Basti","Bhadohi","Bijnor",
      "Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad",
      "Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur",
      "Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat",
      "Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj",
      "Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar",
      "Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal",
      "Sant Kabir Nagar","Shahjahanpur","Shamli","Shrawasti","Siddharthnagar","Sitapur",
      "Sonbhadra","Sultanpur","Unnao","Varanasi",
    ],
  },
  {
    code: "UK",
    name: "Uttarakhand",
    districts: [
      "Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital","Pauri Garhwal",
      "Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar","Uttarkashi",
    ],
  },
  {
    code: "WB",
    name: "West Bengal",
    districts: [
      "Alipurduar","Bankura","Birbhum","Cooch Behar","Dakshin Dinajpur","Darjeeling","Hooghly",
      "Howrah","Jalpaiguri","Jhargram","Kalimpong","Kolkata","Malda","Murshidabad","Nadia",
      "North 24 Parganas","Paschim Bardhaman","Paschim Medinipur","Purba Bardhaman",
      "Purba Medinipur","Purulia","South 24 Parganas","Uttar Dinajpur",
    ],
  },
  // Union Territories
  {
    code: "AN",
    name: "Andaman & Nicobar Islands",
    districts: ["Nicobar","North and Middle Andaman","South Andaman"],
  },
  { code: "CH", name: "Chandigarh", districts: ["Chandigarh"] },
  {
    code: "DH",
    name: "Dadra & Nagar Haveli and Daman & Diu",
    districts: ["Dadra and Nagar Haveli","Daman","Diu"],
  },
  {
    code: "DL",
    name: "Delhi",
    districts: [
      "Central Delhi","East Delhi","New Delhi","North Delhi","North East Delhi","North West Delhi",
      "Shahdara","South Delhi","South East Delhi","South West Delhi","West Delhi",
    ],
  },
  {
    code: "JK",
    name: "Jammu & Kashmir",
    districts: [
      "Anantnag","Bandipora","Baramulla","Budgam","Doda","Ganderbal","Jammu","Kathua","Kishtwar",
      "Kulgam","Kupwara","Poonch","Pulwama","Rajouri","Ramban","Reasi","Samba","Shopian","Srinagar",
      "Udhampur",
    ],
  },
  { code: "LA", name: "Ladakh", districts: ["Kargil","Leh"] },
  { code: "LD", name: "Lakshadweep", districts: ["Lakshadweep"] },
  {
    code: "PY",
    name: "Puducherry",
    districts: ["Karaikal","Mahe","Puducherry","Yanam"],
  },
];

export interface DistrictEntry {
  code: string;
  name: string;
}

export interface StateEntry {
  code: string;
  name: string;
  districts: DistrictEntry[];
}

function makeUniqueCodes(names: string[]): DistrictEntry[] {
  const used = new Set<string>();
  const out: DistrictEntry[] = [];
  for (const name of names) {
    const letters = name.replace(/[^A-Za-z]/g, "");
    let code = letters.slice(0, 3).toUpperCase();
    if (code.length < 3) code = (code + "XXX").slice(0, 3);
    if (!used.has(code)) {
      used.add(code);
      out.push({ code, name });
      continue;
    }
    // Try first letter of words
    const words = name.split(/[\s.\-]+/).filter(Boolean);
    if (words.length >= 3) {
      const c2 = (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
      if (!used.has(c2)) {
        used.add(c2);
        out.push({ code: c2, name });
        continue;
      }
    }
    if (words.length >= 2) {
      const c3 = (words[0][0] + words[1][0] + (words[1][1] || words[0][1] || "X")).toUpperCase();
      if (!used.has(c3)) {
        used.add(c3);
        out.push({ code: c3, name });
        continue;
      }
    }
    // Try 4 letters
    const c4 = letters.slice(0, 4).toUpperCase();
    if (!used.has(c4)) {
      used.add(c4);
      out.push({ code: c4, name });
      continue;
    }
    // Final fallback: append index
    let i = 2;
    let cN = letters.slice(0, 3).toUpperCase() + i;
    while (used.has(cN)) {
      i++;
      cN = letters.slice(0, 3).toUpperCase() + i;
    }
    used.add(cN);
    out.push({ code: cN, name });
  }
  return out;
}

export const INDIA_STATES: StateEntry[] = RAW_STATES.map((s) => ({
  code: s.code,
  name: s.name,
  districts: makeUniqueCodes(s.districts),
}));

export function findDistrict(stateCode: string, districtCode: string): DistrictEntry | null {
  const s = INDIA_STATES.find((x) => x.code === stateCode);
  if (!s) return null;
  return s.districts.find((d) => d.code === districtCode) ?? null;
}

export function findState(stateCode: string): StateEntry | null {
  return INDIA_STATES.find((s) => s.code === stateCode) ?? null;
}
