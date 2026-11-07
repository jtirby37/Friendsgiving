// EDIT THIS FILE to change anything about the game.
// Each answer is ["Answer text", points]. Add or remove rounds and Fast Money questions freely.
window.FEUD = {
  title: "Friendsgiving Family Feud",
  teams: ["Team 1", "Team 2"],          // default names shown on the setup screen
  multipliers: [1, 2, 3],               // point multiplier for round 1, 2, 3...
  fastMoney: { target: 150, bonus: 100, time1: 20, time2: 25 }, // target to hit, bonus points, seconds per player
  games: [
    {
      name: "Turkey Time", theme: "Thanksgiving & Fall",
      rounds: [
        { q: "Name a popular Thanksgiving side dish.", a: [["Mashed potatoes",30],["Stuffing",25],["Mac and cheese",18],["Green bean casserole",15],["Cranberry sauce",12]] },
        { q: "Name something that signals winter is coming.", a: [["Cold weather",35],["Leaves falling",25],["Snow",18],["Daylight getting shorter",12],["Christmas decorations",10]] },
        { q: "Name a flavor associated with fall.", a: [["Pumpkin spice",40],["Apple",25],["Cinnamon",15],["Maple",12],["Caramel",8]] },
      ],
      fast: [
        { q: "Name a Thanksgiving food.", a: [["Turkey",40],["Mashed potatoes",25],["Stuffing",15],["Mac and cheese",12],["Cranberry sauce",8]] },
        { q: "Name something Santa delivers.", a: [["Toys",40],["Presents",30],["Video games",12],["Candy",10],["Coal",8]] },
        { q: "Name something orange.", a: [["Pumpkin",35],["Orange",30],["Carrot",15],["Basketball",12],["Traffic cone",8]] },
        { q: "Name a popular holiday drink.", a: [["Eggnog",35],["Hot chocolate",30],["Apple cider",15],["Hot toddy",12],["Peppermint mocha",8]] },
        { q: "Name something people wear in the snow.", a: [["Coat",35],["Boots",25],["Gloves",18],["Hat",12],["Scarf",10]] },
      ],
    },
    {
      name: "Holiday Mayhem", theme: "Thanksgiving Chaos & Fall",
      rounds: [
        { q: "Name a controversial Thanksgiving food.", a: [["Cranberry sauce",30],["Sweet potato casserole",25],["Green bean casserole",20],["Turkey",15],["Fruitcake",10]] },
        { q: "Name a reason someone might get embarrassed at a holiday party.", a: [["Getting too drunk",35],["Saying something inappropriate",25],["Falling down",18],["Dancing badly",12],["Making a move on someone",10]] },
        { q: "Name a popular fall clothing item.", a: [["Sweater",35],["Hoodie",25],["Boots",18],["Flannel",12],["Scarf",10]] },
      ],
      fast: [
        { q: "Name an NFL team.", a: [["Cowboys",35],["Chiefs",25],["Eagles",18],["Steelers",12],["Giants",10]] },
        { q: "Name a Thanksgiving dessert.", a: [["Pumpkin pie",40],["Apple pie",25],["Pecan pie",15],["Cheesecake",12],["Pudding",8]] },
        { q: "Name a football position.", a: [["Quarterback",40],["Running back",20],["Wide receiver",18],["Linebacker",12],["Kicker",10]] },
        { q: "Name a reason someone gets put on the naughty list.", a: [["Being bad",35],["Lying",25],["Stealing",18],["Fighting",12],["Talking back",10]] },
        { q: "Name something people carve.", a: [["Pumpkin",65],["Turkey",12],["Wood",10],["Ice",8],["Ham",5]] },
      ],
    },
    {
      name: "Mistletoe Madness", theme: "Christmas & Holiday Party",
      rounds: [
        { q: "Name a popular Christmas movie.", a: [["Home Alone",30],["Elf",25],["The Grinch",20],["A Christmas Story",15],["National Lampoon's Christmas Vacation",10]] },
        { q: "Name something people do on Christmas Eve.", a: [["Open one present",30],["Go to church",25],["Watch Christmas movies",20],["Leave cookies for Santa",15],["Track Santa",10]] },
        { q: "Name a popular holiday cocktail.", a: [["Eggnog",30],["Spiked hot chocolate",25],["Mulled wine",18],["Cranberry margarita",15],["Peppermint martini",12]] },
      ],
      fast: [
        { q: "Name a Christmas decoration.", a: [["Christmas tree",40],["Lights",25],["Ornaments",15],["Wreath",12],["Garland",8]] },
        { q: "Name a reason someone gets disowned at Thanksgiving.", a: [["Starting a family argument",30],["Bringing up politics",25],["Insulting the food",20],["Getting too drunk",15],["Announcing bad news",10]] },
        { q: "Name something people bring to a tailgate.", a: [["Beer",35],["Food",25],["Grill",18],["Chairs",12],["Cornhole",10]] },
        { q: "Name a popular Christmas song.", a: [["All I Want for Christmas Is You",35],["Jingle Bells",25],["Last Christmas",18],["Rockin' Around the Christmas Tree",12],["Rudolph the Red-Nosed Reindeer",10]] },
        { q: "Name something people put in a stocking.", a: [["Candy",35],["Gift cards",25],["Socks",18],["Chocolate",12],["Small toys",10]] },
      ],
    },
  ],
};
