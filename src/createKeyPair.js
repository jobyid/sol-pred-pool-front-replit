// Shoutout to Nader Dabit for helping w/ this!
// https://twitter.com/dabit3

const fs = require('fs')
const anchor = require("@project-serum/anchor")

const account = anchor.web3.Keypair.generate()

fs.writeFileSync('./keypair.json', JSON.stringify(account))


//{"_keypair":{"publicKey":{"0":147,"1":21,"2":8,"3":232,"4":202,"5":172,"6":231,"7":149,"8":238,"9":200,"10":209,"11":239,"12":15,"13":154,"14":85,"15":96,"16":155,"17":212,"18":186,"19":122,"20":126,"21":230,"22":173,"23":85,"24":250,"25":105,"26":40,"27":151,"28":167,"29":81,"30":253,"31":16},"secretKey":{"0":6,"1":130,"2":66,"3":186,"4":185,"5":100,"6":21,"7":152,"8":166,"9":218,"10":121,"11":245,"12":122,"13":166,"14":22,"15":108,"16":54,"17":174,"18":185,"19":250,"20":30,"21":98,"22":126,"23":120,"24":233,"25":218,"26":21,"27":206,"28":73,"29":241,"30":4,"31":35,"32":147,"33":21,"34":8,"35":232,"36":202,"37":172,"38":231,"39":149,"40":238,"41":200,"42":209,"43":239,"44":15,"45":154,"46":85,"47":96,"48":155,"49":212,"50":186,"51":122,"52":126,"53":230,"54":173,"55":85,"56":250,"57":105,"58":40,"59":151,"60":167,"61":81,"62":253,"63":16}}}