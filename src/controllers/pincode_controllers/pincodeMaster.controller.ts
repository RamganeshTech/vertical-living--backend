import { Response } from "express";
import PincodeMasterModel from "../../models/Pincode_models/pincodeMaster.model";
import mongoose from "mongoose";




// const CHENNAI_PINCODES = [
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600001",
//     "areaName": "Chennai G.P.O.",
//     "localityName": "George Town",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600002",
//     "areaName": "Anna Salai",
//     "localityName": "Mount Road",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600003",
//     "areaName": "Park Town",
//     "localityName": "Central",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600004",
//     "areaName": "Mylapore",
//     "localityName": "Mandaveli",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600005",
//     "areaName": "Triplicane",
//     "localityName": "Chepauk",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600006",
//     "areaName": "Greesm Road",
//     "localityName": "Nungambakkam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600007",
//     "areaName": "Vepery",
//     "localityName": "Kilpauk",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600008",
//     "areaName": "Egmore",
//     "localityName": "Egmore Station",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600010",
//     "areaName": "Kilpauk",
//     "localityName": "Kellys",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600011",
//     "areaName": "Perambur",
//     "localityName": "Jamalia",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600012",
//     "areaName": "Perambur Barracks",
//     "localityName": "Otteri",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600014",
//     "areaName": "Royapettah",
//     "localityName": "Lloyds Road",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600015",
//     "areaName": "Saidapet",
//     "localityName": "Little Mount",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600017",
//     "areaName": "T Nagar",
//     "localityName": "Hindi Prachar Sabha",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600018",
//     "areaName": "Teynampet",
//     "localityName": "Alwarpet",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600020",
//     "areaName": "Adyar",
//     "localityName": "Kasturba Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600021",
//     "areaName": "Washermanpet",
//     "localityName": "Old Washermanpet",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600024",
//     "areaName": "Kodambakkam",
//     "localityName": "Trustpuram",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600026",
//     "areaName": "Vadapalani",
//     "localityName": "Kumaran Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600028",
//     "areaName": "Raja Annamalaipuram",
//     "localityName": "Foreshore Estate",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600032",
//     "areaName": "Guindy Industrial Estate",
//     "localityName": "Ekkaduthangal",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600033",
//     "areaName": "West Mambalam",
//     "localityName": "Arya Gowder Road",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600034",
//     "areaName": "Loyola College",
//     "localityName": "Nungambakkam High Road",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600035",
//     "areaName": "Nandanam",
//     "localityName": "CIT Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600040",
//     "areaName": "Anna Nagar",
//     "localityName": "Anna Nagar West",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600041",
//     "areaName": "Thiruvanmiyur",
//     "localityName": "Valmiki Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600042",
//     "areaName": "Velachery",
//     "localityName": "Baby Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600044",
//     "areaName": "Chromepet",
//     "localityName": "Nehru Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600045",
//     "areaName": "Tambaram",
//     "localityName": "Tambaram West",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600048",
//     "areaName": "Vandalur",
//     "localityName": "Zoo Area",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600049",
//     "areaName": "Villivakkam",
//     "localityName": "ICF Colony",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600053",
//     "areaName": "Ambattur",
//     "localityName": "Ambattur OT",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600073",
//     "areaName": "Selaiyur",
//     "localityName": "Camp Road",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600078",
//     "areaName": "K K Nagar",
//     "localityName": "Ashok Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600081",
//     "areaName": "Tondiarpet",
//     "localityName": "Kasimedu",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600082",
//     "areaName": "Jawahar Nagar",
//     "localityName": "Agaram",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600083",
//     "areaName": "Ashok Nagar",
//     "localityName": "Jafferkhanpet",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600085",
//     "areaName": "Kotturpuram",
//     "localityName": "Kottur",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600087",
//     "areaName": "Valasaravakkam",
//     "localityName": "Alwarthirunagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600088",
//     "areaName": "Adambakkam",
//     "localityName": "Ram Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600091",
//     "areaName": "Madipakkam",
//     "localityName": "Kuberan Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600092",
//     "areaName": "Virugambakkam",
//     "localityName": "Venkatesa Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600094",
//     "areaName": "Choolaimedu",
//     "localityName": "Sowrashtra Nagar",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600096",
//     "areaName": "Perungudi",
//     "localityName": "Industrial Estate",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600097",
//     "areaName": "Thoraipakkam",
//     "localityName": "Okkiyam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600099",
//     "areaName": "Ponniammanmedu",
//     "localityName": "Madhavaram",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600100",
//     "areaName": "Pallikaranai",
//     "localityName": "Medavakkam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600113",
//     "areaName": "Taramani",
//     "localityName": "IIT Madras",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600116",
//     "areaName": "Porur",
//     "localityName": "Mugalivakkam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600117",
//     "areaName": "Kovilambakkam",
//     "localityName": "Nanmangalam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600119",
//     "areaName": "Sholinganallur",
//     "localityName": "Karapakkam",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600122",
//     "areaName": "Mangadu",
//     "localityName": "Kumananchavadi",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600123",
//     "areaName": "Kattupakkam",
//     "localityName": "Iyyapanthangal",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600125",
//     "areaName": "Kandanchavadi",
//     "localityName": "Perungudi OMR",
//     "district": "Chennai"
//   },
//   {
//     "organizationId": "684a57015e439b678e8f6918",
//     "pincode": "600126",
//     "areaName": "Urapakkam",
//     "localityName": "Guduvanchery North",
//     "district": "Chennai"
//   }
// ]



const CHENGALPATTU_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603001",
    "areaName": "Chengalpattu",
    "localityName": "Chengalpattu Bazaar",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603002",
    "areaName": "Chengalpattu Collectorate",
    "localityName": "Gundu Uppalavadi",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603003",
    "areaName": "Chengalpattu Industrial Estate",
    "localityName": "Putheri",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603101",
    "areaName": "Mahabalipuram",
    "localityName": "Mamallapuram",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603102",
    "areaName": "Kelambakkam",
    "localityName": "Kazhipattur",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603103",
    "areaName": "Kelambakkam South",
    "localityName": "Pudupakkam",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603104",
    "areaName": "Covelong",
    "localityName": "Kovalam",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603108",
    "areaName": "Kalpakkam",
    "localityName": "DAE Township",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603110",
    "areaName": "Thiruporur",
    "localityName": "Kalavakkam",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603202",
    "areaName": "Guduvanchery",
    "localityName": "Nandivaram",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603203",
    "areaName": "Potheri",
    "localityName": "SRM University Campus",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603204",
    "areaName": "Maraimalai Nagar",
    "localityName": "Kattankulathur",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603209",
    "areaName": "Singaperumal Koil",
    "localityName": "Chettipunyam",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603210",
    "areaName": "Mahindra World City",
    "localityName": "Anjur",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600048",
    "areaName": "Vandalur",
    "localityName": "Otteri Extension",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600059",
    "areaName": "Tambaram East",
    "localityName": "Selaiyur",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600063",
    "areaName": "Perungalathur",
    "localityName": "Peerkankaranai",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600064",
    "areaName": "Chromepet South",
    "localityName": "Hastinapuram",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600073",
    "areaName": "Selaiyur",
    "localityName": "Rajakilpakkam",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600126",
    "areaName": "Urapakkam",
    "localityName": "Revathipuram",
    "district": "Chengalpattu"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600127",
    "areaName": "Bharathi Nagar",
    "localityName": "Mudichur",
    "district": "Chengalpattu"
  }
]


const TIRUVALLUR_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600053",
    "areaName": "Ambattur",
    "localityName": "Ambattur OT",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600054",
    "areaName": "Avadi",
    "localityName": "Avadi Camp",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600055",
    "areaName": "Avadi I.A.F.",
    "localityName": "Muthapudupet",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600056",
    "areaName": "Poonamallee",
    "localityName": "Kattupakkam",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600057",
    "areaName": "Ennore Thermal Station",
    "localityName": "Ennore",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600058",
    "areaName": "Ambattur Industrial Estate",
    "localityName": "Pattaravakkam",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600062",
    "areaName": "Pattabiram",
    "localityName": "Thandurai",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600066",
    "areaName": "Madhavaram",
    "localityName": "Madhavaram Milk Colony",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600067",
    "areaName": "Red Hills",
    "localityName": "Puzhal",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600071",
    "areaName": "Thirunindravur",
    "localityName": "Pakkam",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600072",
    "areaName": "Thirumullaivoyal",
    "localityName": "Vellanur",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600077",
    "areaName": "Thiruverkadu",
    "localityName": "Sundaracholapuram",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600103",
    "areaName": "Manali",
    "localityName": "Mathur",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "600124",
    "areaName": "Minjur",
    "localityName": "Kattupalli",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "601201",
    "areaName": "Ponneri",
    "localityName": "Kaveripettai",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "601204",
    "areaName": "Gummidipoondi",
    "localityName": "SIPCOT",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602001",
    "areaName": "Tiruvallur Town",
    "localityName": "Tiruvallur HO",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602002",
    "areaName": "Tiruvallur RS",
    "localityName": "Putlur",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602024",
    "areaName": "Sriperumbudur Area",
    "localityName": "Mappedu",
    "district": "Tiruvallur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631203",
    "areaName": "Tiruttani",
    "localityName": "Tiruttani South",
    "district": "Tiruvallur"
  }
]

const KANCHIPURAM_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631501",
    "areaName": "Kanchipuram",
    "localityName": "Kanchipuram HO",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631502",
    "areaName": "Big Kanchipuram",
    "localityName": "Olimohamedpet",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631503",
    "areaName": "Little Kanchipuram",
    "localityName": "Collectorate Office",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602105",
    "areaName": "Pattunoolchatram",
    "localityName": "Sriperumbudur",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602106",
    "areaName": "Sunguvarchatram",
    "localityName": "Melmaduramangalam",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "602117",
    "areaName": "Irungattukottai",
    "localityName": "SIPCOT Industrial Park",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631601",
    "areaName": "Ayyampettai",
    "localityName": "Thenambakkam",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631604",
    "areaName": "Thenneri",
    "localityName": "Manjamedu",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631605",
    "areaName": "Walajabad",
    "localityName": "Nathanallur",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "603406",
    "areaName": "Uthiramerur",
    "localityName": "Kaliyampoondi",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631551",
    "areaName": "Damal",
    "localityName": "Krishnapuram",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631552",
    "areaName": "Parandur",
    "localityName": "Siruvakkam",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631553",
    "areaName": "Pullalur",
    "localityName": "Purisai",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631561",
    "areaName": "Enathur",
    "localityName": "SCSVMV University",
    "district": "Kanchipuram"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631603",
    "areaName": "Magaral",
    "localityName": "Kaveripakkam Road",
    "district": "Kanchipuram"
  }
]

const VELLORE_PINCODE = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632001",
    "areaName": "Vellore HO",
    "localityName": "Velapadi",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632002",
    "areaName": "Bagayam",
    "localityName": "CMC Colony",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632004",
    "areaName": "Vellore Bazaar",
    "localityName": "Gandhi Road",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632006",
    "areaName": "Gandhi Nagar",
    "localityName": "Katpadi Extension",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632007",
    "areaName": "Katpadi",
    "localityName": "Kasam",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632012",
    "areaName": "Kagithapattarai",
    "localityName": "Saidapet Vellore",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632014",
    "areaName": "Bramhapuram",
    "localityName": "VIT University Area",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632401",
    "areaName": "Ranipet",
    "localityName": "Ranipet HO",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632406",
    "areaName": "BHEL Ranipet",
    "localityName": "Mukundarayapuram",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632503",
    "areaName": "Arcot",
    "localityName": "Arcot Town",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "632602",
    "areaName": "Gudiyattam",
    "localityName": "Gudiyattam HO",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "631001",
    "areaName": "Arakkonam",
    "localityName": "Arakkonam HO",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635802",
    "areaName": "Ambur",
    "localityName": "Ambur Town",
    "district": "Vellore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635751",
    "areaName": "Vaniyambadi",
    "localityName": "Vaniyambadi Town",
    "district": "Vellore"
  }
]

const CUDDALORE_PINCODE = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607001",
    "areaName": "Cuddalore HO",
    "localityName": "Manjakuppam",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607002",
    "areaName": "Tirupapuliyur",
    "localityName": "Koothapakkam",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607003",
    "areaName": "Cuddalore Old Town",
    "localityName": "Cuddalore Port",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607005",
    "areaName": "SIPCOT Cuddalore",
    "localityName": "Kudikadu",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607106",
    "areaName": "Panruti",
    "localityName": "Lakshminarayanapuram",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "608001",
    "areaName": "Chidambaram",
    "localityName": "Annamalai Nagar",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "608002",
    "areaName": "Annamalainagar",
    "localityName": "University Campus",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607801",
    "areaName": "Neyveli 1",
    "localityName": "Neyveli Township",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607802",
    "areaName": "Neyveli 2",
    "localityName": "Mandarakuppam",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607303",
    "areaName": "Vadalur",
    "localityName": "Raghunathapuram",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "606001",
    "areaName": "Virudhachalam HO",
    "localityName": "Pudupettai",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "607302",
    "areaName": "Kurinjipadi",
    "localityName": "Thandavanallur",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "608502",
    "areaName": "Parangipettai",
    "localityName": "Porto Novo",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "608301",
    "areaName": "Kattumannarkoil",
    "localityName": "Kattumannarkoil Town",
    "district": "Cuddalore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "608702",
    "areaName": "Sethiathope",
    "localityName": "Chidambaram Road",
    "district": "Cuddalore"
  }
]


const COIMBATORE_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641001",
    "areaName": "Coimbatore HO",
    "localityName": "Town Hall",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641002",
    "areaName": "R.S. Puram",
    "localityName": "R.S. Puram East",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641003",
    "areaName": "Lawley Road",
    "localityName": "Agricultural University",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641004",
    "areaName": "Peelamedu",
    "localityName": "Bharathi Colony",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641005",
    "areaName": "Singanallur",
    "localityName": "Varadharajapuram",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641006",
    "areaName": "Ganapathy",
    "localityName": "Maniyakaranpalayam",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641008",
    "areaName": "Kuniamuthur",
    "localityName": "Ukkadam",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641009",
    "areaName": "Ramnagar",
    "localityName": "Anupparpalayam",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641011",
    "areaName": "Saibaba Colony",
    "localityName": "Saibaba Mission",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641012",
    "areaName": "Gandhipuram",
    "localityName": "Cross Cut Road",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641014",
    "areaName": "Coimbatore Aerodrome",
    "localityName": "Sitra",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641018",
    "areaName": "Coimbatore Central",
    "localityName": "Collectorate",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641021",
    "areaName": "Coimbatore Industrial Estate",
    "localityName": "Eachanari",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641030",
    "areaName": "Kavundampalayam",
    "localityName": "Cheran Nagar",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641035",
    "areaName": "Saravanampatti",
    "localityName": "Keeranatham",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641037",
    "areaName": "Pappanaickenpalayam",
    "localityName": "Lakshmi Mills",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641041",
    "areaName": "Vadavalli",
    "localityName": "Mullai Nagar",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641042",
    "areaName": "Kovaipudur",
    "localityName": "Arivu Nagar",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641045",
    "areaName": "Ramanathapuram",
    "localityName": "Krishnaswamy Nagar",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641046",
    "areaName": "Bharathiyar University",
    "localityName": "Marudhamalai Road",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "641301",
    "areaName": "Mettupalayam",
    "localityName": "Mettupalayam Bazar",
    "district": "Coimbatore"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "642001",
    "areaName": "Pollachi HO",
    "localityName": "Pollachi Town",
    "district": "Coimbatore"
  }
]


const ARIYALUR_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621704",
    "areaName": "Ariyalur HO",
    "localityName": "Market Street",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621729",
    "areaName": "Ariyalur Cements",
    "localityName": "TANCEM Township",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621701",
    "areaName": "Jayankondam",
    "localityName": "Jayankondam Road",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621705",
    "areaName": "Kizhapalur",
    "localityName": "Kizhapalur South",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621707",
    "areaName": "Sendurai",
    "localityName": "Railway Station Road",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621713",
    "areaName": "Andimadam",
    "localityName": "Vilanthai",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621715",
    "areaName": "Udayarpalayam",
    "localityName": "Palayam Fort",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621718",
    "areaName": "Gangaikondacholapuram",
    "localityName": "Temple Area",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621706",
    "areaName": "Thamaraikulam",
    "localityName": "Near Collectorate",
    "district": "Ariyalur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621802",
    "areaName": "Tirumanur",
    "localityName": "Kizhapaluvur",
    "district": "Ariyalur"
  }
]


const DHARMAPURI_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636701",
    "areaName": "Dharmapuri HO",
    "localityName": "Dharmapuri Bazaar",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636702",
    "areaName": "Dharmapuri Collectorate",
    "localityName": "Adhiyaman Kottai",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636703",
    "areaName": "Bharathipuram",
    "localityName": "Dharmapuri RS",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636704",
    "areaName": "Pennagaram",
    "localityName": "Pennagaram Town",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636705",
    "areaName": "Hogenakkal",
    "localityName": "Hogenakkal Falls Area",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636803",
    "areaName": "Harur",
    "localityName": "Harur Town",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636807",
    "areaName": "Palacode",
    "localityName": "Marandahalli Road",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636808",
    "areaName": "Pappireddipatti",
    "localityName": "Pappireddipatti East",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "636809",
    "areaName": "Bommidi",
    "localityName": "Bommidi Railway Station",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636811",
    "areaName": "Morappur",
    "localityName": "Morappur Junction",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635111",
    "areaName": "Karimangalam",
    "localityName": "Karimangalam Town",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635202",
    "areaName": "Kambainallur",
    "localityName": "Kambainallur Main Road",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636905",
    "areaName": "Kadathur",
    "localityName": "Kadathur Bazaar",
    "district": "Dharmapuri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635106",
    "areaName": "Marandahalli",
    "localityName": "Marandahalli Town",
    "district": "Dharmapuri"
  }
]


const KRISHNAGIRI_PINCODE = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635001",
    "areaName": "Krishnagiri HO",
    "localityName": "Londenpet",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635002",
    "areaName": "Krishnagiri Indl. Estate",
    "localityName": "Kaveripattinam Road",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635109",
    "areaName": "Hosur HO",
    "localityName": "Avalapalli Road",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635126",
    "areaName": "Hosur Indl. Complex",
    "localityName": "Mookandapalli",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635104",
    "areaName": "Bargur",
    "localityName": "Bargur Bazaar",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635107",
    "areaName": "Denkanikottai",
    "localityName": "Denkanikottai Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635117",
    "areaName": "Shoolagiri",
    "localityName": "Shoolagiri Bazaar",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635112",
    "areaName": "Kaveripattinam",
    "localityName": "Palanisamy Gounder Street",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635103",
    "areaName": "Bagalur",
    "localityName": "Bagalur Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635113",
    "areaName": "Kelamangalam",
    "localityName": "Bairamangalam Road",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635121",
    "areaName": "Veppanapalli",
    "localityName": "Veppanapalli Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635206",
    "areaName": "Pochampalli",
    "localityName": "Pochampalli Bazaar",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635304",
    "areaName": "Uthangarai",
    "localityName": "Uthangarai Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635105",
    "areaName": "Berigai",
    "localityName": "Berigai Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635114",
    "areaName": "Mathagondapalli",
    "localityName": "Mathagondapalli East",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635115",
    "areaName": "Krishnagiri Collectorate",
    "localityName": "Rayakottai Road",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635102",
    "areaName": "Anchetty",
    "localityName": "Anchetty Town",
    "district": "Krishnagiri"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "635110",
    "areaName": "Hosur Cattle Farm",
    "localityName": "Mathigiri",
    "district": "Krishnagiri"
  }
]

const ERODE_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638001",
    "areaName": "Erode HO",
    "localityName": "Erode Fort",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638002",
    "areaName": "Erode Railway Colony",
    "localityName": "Surampatti",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638003",
    "areaName": "Erode Bazaar",
    "localityName": "Cauvery RS",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638004",
    "areaName": "Chikkaiah Naicker College",
    "localityName": "Veerappanchatram",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638009",
    "areaName": "Edayankattuvalasu",
    "localityName": "Sampath Nagar",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638011",
    "areaName": "Erode Collectorate",
    "localityName": "Periyar Nagar",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638012",
    "areaName": "Erode Housing Unit",
    "localityName": "Manickampalayam",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638052",
    "areaName": "Perundurai",
    "localityName": "SIPCOT Perundurai",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638051",
    "areaName": "Chennimalai",
    "localityName": "Chennimalai Town",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638102",
    "areaName": "Chittode",
    "localityName": "IRTT Campus",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638151",
    "areaName": "Kodumudi",
    "localityName": "Kodumudi Town",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638301",
    "areaName": "Bhavani",
    "localityName": "Anthiyur Road",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638401",
    "areaName": "Sathyamangalam",
    "localityName": "Rangasamudram",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638452",
    "areaName": "Gobichettipalayam",
    "localityName": "Gobi HO",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638501",
    "areaName": "Anthiyur",
    "localityName": "Anthiyur Town",
    "district": "Erode"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "638402",
    "areaName": "Punjai Puliampatti",
    "localityName": "Vadavalli Road",
    "district": "Erode"
  }
]

const KARUR_PINCODE = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639001",
    "areaName": "Karur HO",
    "localityName": "Karur West",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639002",
    "areaName": "Sengunthapuram",
    "localityName": "Mudiganam",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639003",
    "areaName": "Tirumanilaiyur",
    "localityName": "Thoranakkalpatti",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639004",
    "areaName": "Gandhigramam",
    "localityName": "Pasupathipalayam",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639005",
    "areaName": "Thanthonimalai",
    "localityName": "Paganatham",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639006",
    "areaName": "Vennamalai",
    "localityName": "Manmangalam",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639007",
    "areaName": "Karur Collectorate",
    "localityName": "Kathalapatti",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639008",
    "areaName": "Andankoil",
    "localityName": "L.N.Samudram",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639102",
    "areaName": "Krishnarayapuram",
    "localityName": "Mahadhanapuram",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639104",
    "areaName": "Kulittalai HO",
    "localityName": "Kulittalai Bazaar",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639105",
    "areaName": "Lalapet",
    "localityName": "Karuppathur",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639108",
    "areaName": "Mayanur",
    "localityName": "Kattalai",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639114",
    "areaName": "Puliyur Cement Factory",
    "localityName": "Uppidamangalam",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639116",
    "areaName": "Vangal",
    "localityName": "Kuppachipalayam",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639118",
    "areaName": "Velliyanai",
    "localityName": "Jegadabi",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639201",
    "areaName": "Aravakurichi",
    "localityName": "Chinnakariyampatti",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639202",
    "areaName": "Chinnadharapuram",
    "localityName": "Elavanur",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639205",
    "areaName": "Pallapatti",
    "localityName": "Pallapatti Bazaar",
    "district": "Karur"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "639136",
    "areaName": "Kagtithapuram",
    "localityName": "TNPL Pugalur",
    "district": "Karur"
  }
]


const SALEM_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636001",
    "areaName": "Salem HO",
    "localityName": "Salem Town",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636002",
    "areaName": "Annadanapatti",
    "localityName": "Gugai",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636003",
    "areaName": "Salem Junction",
    "localityName": "Suramangalam",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636004",
    "areaName": "Hasthampatti",
    "localityName": "Alagapuram",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636005",
    "areaName": "Fairlands",
    "localityName": "Brindavan Road",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636006",
    "areaName": "Ammapet",
    "localityName": "Salem East",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636007",
    "areaName": "Salem Collectorate",
    "localityName": "Kottai",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636008",
    "areaName": "Kondalampatti",
    "localityName": "Salem South",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636011",
    "areaName": "Government Engineering College",
    "localityName": "Karuveppampatti",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636013",
    "areaName": "Salem Steel Plant",
    "localityName": "Steel Plant Township",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636016",
    "areaName": "Kannankurichi",
    "localityName": "Yercaud Foot Hills",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636601",
    "areaName": "Yercaud",
    "localityName": "Yercaud Town",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636401",
    "areaName": "Mettur Dam",
    "localityName": "Mettur HO",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636302",
    "areaName": "Omalur",
    "localityName": "Omalur Town",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636102",
    "areaName": "Attur",
    "localityName": "Attur HO",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "637105",
    "areaName": "Edappadi",
    "localityName": "Edappadi Town",
    "district": "Salem"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "636115",
    "areaName": "Vazhapadi",
    "localityName": "Vazhapadi Town",
    "district": "Salem"
  }
]

const TRICHY_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620001",
    "areaName": "Tiruchirappalli HO",
    "localityName": "Trichy Cantonment",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620002",
    "areaName": "Tiruchirappalli Fort",
    "localityName": "Teppakulam",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620003",
    "areaName": "Tiruchirappalli Town",
    "localityName": "Palakkarai",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620006",
    "areaName": "Thillai Nagar",
    "localityName": "Shastri Road",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620008",
    "areaName": "Tennur",
    "localityName": "Anna Nagar",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620012",
    "areaName": "Crawford",
    "localityName": "Edamalaipatti Pudur",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620014",
    "areaName": "BHEL Township",
    "localityName": "Kailasapuram",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620015",
    "areaName": "Thuvakudi",
    "localityName": "NIT Trichy Campus",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620017",
    "areaName": "Golden Rock",
    "localityName": "Ponmalai",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620018",
    "areaName": "Srirangam",
    "localityName": "Thiruvanaikoil",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "620021",
    "areaName": "KK Nagar Trichy",
    "localityName": "Airport Area",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621001",
    "areaName": "Lalgudi",
    "localityName": "Lalgudi Town",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621005",
    "areaName": "Manachanallur",
    "localityName": "No 1 Tollgate",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621212",
    "areaName": "Musiri",
    "localityName": "Musiri Town",
    "district": "Tiruchirappalli"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "621306",
    "areaName": "Manapparai",
    "localityName": "Manapparai HO",
    "district": "Tiruchirappalli"
  }
]

const MADURAI_PINCODES = [
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625001",
    "areaName": "Madurai City HO",
    "localityName": "Town Hall Road",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625002",
    "areaName": "Sellur",
    "localityName": "Meenambalpuram",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625003",
    "areaName": "Madurai Tallakulam",
    "localityName": "Goripalayam",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625007",
    "areaName": "K.Pudur",
    "localityName": "Surveyor Colony",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625008",
    "areaName": "Pasumalai",
    "localityName": "Thirupparankundram Road",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625009",
    "areaName": "Madurai East",
    "localityName": "Teppakulam",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625010",
    "areaName": "Bibikulam",
    "localityName": "Narimedu",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625011",
    "areaName": "Shenoy Nagar",
    "localityName": "Collectorate Office",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625012",
    "areaName": "Anupanadi",
    "localityName": "Chintamani",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625014",
    "areaName": "Anna Nagar Madurai",
    "localityName": "Sathamangalam",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625016",
    "areaName": "Madurai West",
    "localityName": "Arasaradi",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625017",
    "areaName": "Kochadai",
    "localityName": "Fenner India Area",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625018",
    "areaName": "Madurai South",
    "localityName": "South Gate",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625020",
    "areaName": "K.K. Nagar Madurai",
    "localityName": "District Court Area",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625022",
    "areaName": "Kappalur Industrial Estate",
    "localityName": "Thirumangalam Road",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625706",
    "areaName": "Thirumangalam",
    "localityName": "Thirumangalam Town",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625501",
    "areaName": "Alanganallur",
    "localityName": "Jallikattu Ground Area",
    "district": "Madurai"
  },
  {
    "organizationId": "684a57015e439b678e8f6918",
    "pincode": "625106",
    "areaName": "Melur",
    "localityName": "Melur Town",
    "district": "Madurai"
  }
]

// const seedDatabase = async () => {
//     try {
       

//         const ALL_PINCODEs = [
//             ...CHENGALPATTU_PINCODES,
//             ...TIRUVALLUR_PINCODES,
//             ...KANCHIPURAM_PINCODES,
//             ...VELLORE_PINCODE,
//             ...CUDDALORE_PINCODE,
//             ...COIMBATORE_PINCODES,
//             ...MADURAI_PINCODES,
//             ...ARIYALUR_PINCODES,
//             ...DHARMAPURI_PINCODES,
//             ...KRISHNAGIRI_PINCODE,
//             ...ERODE_PINCODES,
//             ...KARUR_PINCODE,
//             ...SALEM_PINCODES,
//             ...TRICHY_PINCODES,

//         ]
       
//         // 3. Insert Many
//         // We use ordered: false so if one fails (e.g. duplicate key), others still insert
//         const pins = await PincodeMasterModel.insertMany(ALL_PINCODEs, { ordered: false });
// // 3. View Summary in Terminal
//         console.log("-----------------------------------------------");
//         console.log("✅ SEEDING SUMMARY");
//         console.log(`Total Pincodes Created: ${pins.length}`);
//         console.log("-----------------------------------------------");

//         // Optional: Count by District to verify distribution
//         const districtCount = pins.reduce((acc: any, curr: any) => {
//             acc[curr.district] = (acc[curr.district] || 0) + 1;
//             return acc;
//         }, {});
        
//         console.log("Breakdown by District:", districtCount);

//         process.exit(0);

//     } catch (error: any) {
//         console.error("❌ Error seeding data:", error.message);

//         if (error.code === 11000 || error.writeErrors) {
//             console.warn("⚠️ Note: Some duplicate pincodes were skipped.");
//             console.log(`Successfully inserted: ${error.insertedDocs?.length || 0} new records.`);
//         } else {
//             console.error("❌ Critical Error seeding data:", error.message);
//         }
//         process.exit(1);
//     }
// };
// sljfd ;ajdfkl aldsjfskj asdj ;sadj;laksjd  skl;djf dkljf  asd;lfjk ;asjdk ;asjldf  ;asjdf ;askdjf  ;asdkj ;asdj 
// // // // // seedDatabase();

// 1. CREATE Pincode Record
export const createPincode = async (req: any, res: Response): Promise<any> => {
    try {
        // Destructuring to ensure we only use allowed fields [cite: 76]
        const {
            organizationId,
            pincode,
            areaName,
            localityName,
            taluk,
            district,
            zone,
            state,
            latitude,
            longitude,
            urbanClassification,
            serviceStatus,
            serviceMode,
            approvalRequired,
            minOrderValue,
            directMarginPercent,
            partnerMarginPercent,
            transportFactor,
            installFactor,
            serviceFactor,
            complexityFactor,
            riskLevel,
            notes,
            partners
        } = req.body;

        // Basic validation for required fields
        if (!organizationId || !pincode) {
            return res.status(400).json({ ok: false, message: "Organization ID and Pincode are required" });
        }

        const newPincode = await PincodeMasterModel.create({
            organizationId,
            pincode,
            areaName: areaName?.trim(),
            localityName: localityName?.trim(),
            taluk: taluk?.trim(),
            district: district || null,
            zone: zone || null,
            state: state || "Tamil Nadu",
            latitude,
            longitude,
            urbanClassification: urbanClassification || "Urban",
            serviceStatus: serviceStatus || "Active",
            serviceMode: serviceMode || "Direct Core",
            approvalRequired: approvalRequired || false,
            minOrderValue: minOrderValue || 0,
            directMarginPercent: directMarginPercent || 0,
            partnerMarginPercent: partnerMarginPercent || 0,
            transportFactor: transportFactor || 1.0,
            installFactor: installFactor || 1.0,
            serviceFactor: serviceFactor || 1.0,
            complexityFactor: complexityFactor || 1.0,
            riskLevel: riskLevel || "Low",
            notes: notes || null,
            lastReviewedAt: new Date(),
            partners: partners || [],
        });

        return res.status(201).json({
            ok: true,
            message: "Pincode record created successfully",
            data: newPincode
        });
    } catch (error: any) {
        console.error("Error creating pincode:", error);
        return res.status(500).json({ ok: false, message: "Error creating pincode", error: error.message });
    }
};

// 2. GET ALL Pincodes (with Pagination)
export const getAllPincodes = async (req: any, res: Response): Promise<any> => {
    try {
        const { organizationId,
            search,
            startDate,
            endDate,
            urbanClassification,
            serviceStatus } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const query: any = {};
        if (organizationId) query.organizationId = organizationId;

        // 2. Date Range Filter (based on creation/review date) 
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        // 3. Global Search (Pincode, Area, Locality, Taluk, State) [cite: 79-85]
        if (search) {
            const searchRegex = new RegExp(search as string, 'i');
            query.$or = [
                { pincode: searchRegex },
                { district: searchRegex },
                { areaName: searchRegex },
                { localityName: searchRegex },
                { taluk: searchRegex },
                { state: searchRegex }
            ];
        }

        // 4. Specific Business Filters [cite: 87, 95]
        if (urbanClassification) query.urbanClassification = urbanClassification;
        if (serviceStatus) query.serviceStatus = serviceStatus;

        // Fetching records with pagination and population for IDs [cite: 83, 84]
        const [pincodes, totalCount] = await Promise.all([
            PincodeMasterModel.find(query)
                // .populate("districtId zoneId reviewedBy")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            PincodeMasterModel.countDocuments(query)
        ]);

        return res.status(200).json({
            ok: true,
            data: pincodes,
            pagination: {
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: skip + pincodes.length < totalCount
            }
        });
    } catch (error: any) {
        console.error("Error fetching pincodes:", error);
        return res.status(500).json({ ok: false, message: "Error fetching pincodes", error: error.message });
    }
};

// 3. GET SINGLE Pincode Record
export const getSinglePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // const pincode = await PincodeMasterModel.findById(id)
        const pincode = await PincodeMasterModel.findById(id)
            .populate({
                path: 'partners.partnerId', // Path to the field inside the array
                select: 'companyName firstName email phone' // Fields you want to show
            })
        // .populate("districtId zoneId reviewedBy");

        if (!pincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found" });
        }

        return res.status(200).json({ ok: true, data: pincode });
    } catch (error: any) {
        console.error("Error fetching single pincode:", error);
        return res.status(500).json({ ok: false, message: "Error fetching pincode record", error: error.message });
    }
};

// 4. UPDATE Pincode Record
export const updatePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Destructure incoming updates to prevent unauthorized field injection
        const {
            pincode,
            areaName,
            localityName,
            taluk,
            district,
            zone,
            state,
            latitude,
            longitude,
            urbanClassification,
            activeStatus,
            serviceStatus,
            serviceMode,
            approvalRequired,
            minOrderValue,
            directMarginPercent,
            partnerMarginPercent,
            transportFactor,
            installFactor,
            serviceFactor,
            complexityFactor,
            riskLevel,
            notes,
            reviewedBy,
            partners: partners,
        } = req.body;

        const updatedPincode = await PincodeMasterModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    pincode,
                    areaName,
                    localityName,
                    taluk,
                    district,
                    zone,
                    state,
                    latitude,
                    longitude,
                    urbanClassification,
                    activeStatus,
                    serviceStatus,
                    serviceMode,
                    approvalRequired,
                    minOrderValue,
                    directMarginPercent,
                    partnerMarginPercent,
                    transportFactor,
                    installFactor,
                    serviceFactor,
                    complexityFactor,
                    riskLevel,
                    notes,
                    reviewedBy,
                    lastReviewedAt: new Date(), // 
                    partners: partners,
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedPincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found to update" });
        }

        return res.status(200).json({
            ok: true,
            message: "Pincode record updated successfully",
            data: updatedPincode
        });
    } catch (error: any) {
        console.error("Error updating pincode:", error);
        return res.status(500).json({ ok: false, message: "Error updating pincode", error: error.message });
    }
};

// 5. DELETE Pincode Record
export const deletePincode = async (req: any, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        const deletedPincode = await PincodeMasterModel.findByIdAndDelete(id);

        if (!deletedPincode) {
            return res.status(404).json({ ok: false, message: "Pincode record not found" });
        }

        return res.status(200).json({ ok: true, message: "Pincode record deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting pincode:", error);
        return res.status(500).json({ ok: false, message: "Error deleting pincode", error: error.message });
    }
};