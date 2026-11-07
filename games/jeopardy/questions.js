// EDIT THIS FILE to change anything about the game.
// Each category needs one clue per value in "values". Add dd:true for a Daily Double.
// Clues and answers can use simple HTML like <i>italics</i>.
window.JEOPARDY = {
  title: "Friendsgiving Jeopardy",
  teams: ["Team 1", "Team 2", "Team 3", "Team 4"],   // default names shown on the setup screen
  rounds: [
    { name: "Jeopardy!", values: [200,400,600,800,1000], categories: [
      { name: "Turkey Talk", clues: [
        {q:"The loose flap of skin hanging from a turkey’s throat",a:"What is a wattle?"},
        {q:"Ben Franklin preferred the turkey to this national symbol",a:"What is the bald eagle?"},
        {q:"Since 1981, this turkey brand’s Talk-Line has answered panicked cooks’ questions every November",a:"What is Butterball?"},
        {q:"This president formalized the turkey pardon in 1989",a:"Who is George H. W. Bush?"},
        {q:"A group of wild turkeys is called this",a:"What is a rafter?",dd:true},
      ]},
      { name: "Thanksgiving Pop Culture", clues: [
        {q:"<i>Planes, Trains and Automobiles</i> stars John Candy and this actor",a:"Who is Steve Martin?"},
        {q:"In <i>A Charlie Brown Thanksgiving</i>, Snoopy sets up the dinner on this kind of table",a:"What is a ping-pong table?"},
        {q:"In <i>Gilmore Girls</i>, Lorelai and Rory try to eat this many Thanksgiving dinners in one day",a:"What is four?"},
        {q:"Arlo Guthrie’s “Alice’s Restaurant” plays on the radio every Thanksgiving and is about being arrested for this minor offense",a:"What is littering?"},
        {q:"The Macy’s Thanksgiving Day Parade traditionally ends with this figure’s float",a:"Who is Santa Claus?"},
      ]},
      { name: "Pie Chart", clues: [
        {q:"Spice grated from a tropical seed; its outer covering is mace",a:"What is nutmeg?"},
        {q:"Pecan pie gets its sticky, gooey filling from eggs, butter, and this Karo-brand ingredient",a:"What is corn syrup?"},
        {q:"This company’s test kitchen invented green bean casserole in 1955",a:"What is Campbell’s?"},
        {q:"This spice, sold as the dried berry of a Caribbean tree, tastes like cinnamon, nutmeg, and cloves combined",a:"What is allspice?"},
        {q:"The pecan is a type of this tree, whose wood is also popular for smoking barbecue",a:"What is hickory?"},
      ]},
      { name: "Fall Fashion", clues: [
        {q:"This Australian brand’s sheepskin boots became an autumn staple",a:"What is UGG?"},
        {q:"The raised ridges in corduroy fabric are called this",a:"What are wales?"},
        {q:"Cable-knit Aran sweaters are named for islands off the coast of this country",a:"What is Ireland?"},
        {q:"The trench coat gets its name from soldiers fighting in this conflict",a:"What is World War I?"},
        {q:"Costumes show Pilgrims with these metal fasteners on their hats and shoes, but the real Pilgrims didn’t wear them",a:"What are buckles?"},
      ]},
      { name: "Side Dish Stories", clues: [
        {q:"In much of the South, stuffing baked outside the bird is called this",a:"What is dressing?"},
        {q:"Potatoes were first cultivated in the Andes, in what is now this country",a:"What is Peru?"},
        {q:"This state grows more sweet potatoes than any other",a:"What is North Carolina?"},
        {q:"In 1972, General Foods introduced this boxed stuffing mix",a:"What is Stove Top?"},
        {q:"Brussels sprouts, kale, broccoli, and cauliflower are all cultivated forms of this one plant",a:"What is wild cabbage?"},
      ]},
    ]},
    { name: "Double Jeopardy!", values: [400,800,1200,1600,2000], categories: [
      { name: "Parade & Pigskin", clues: [
        {q:"This NFL team has played at home on Thanksgiving since 1934",a:"Who are the Detroit Lions?"},
        {q:"This famed New York dance troupe, known for its precision kick line, performs in the Macy’s Thanksgiving Day Parade",a:"Who are the Rockettes?"},
        {q:"Announcer John Madden popularized this three-bird dish by giving it to Thanksgiving game winners",a:"What is turducken?"},
        {q:"The 1947 classic <i>Miracle on 34th Street</i> opens with this Thanksgiving event",a:"What is the Macy’s Thanksgiving Day Parade?"},
        {q:"In 1927, this black-and-white cartoon cat became the parade’s first giant balloon",a:"Who is Felix the Cat?",dd:true},
      ]},
      { name: "2026 in Review", clues: [
        {q:"This team won its first World Series title in franchise history in 2026",a:"Who are the Milwaukee Brewers?"},
        {q:"This Puerto Rican superstar headlined the Super Bowl LX halftime show, with guests Lady Gaga and Ricky Martin",a:"Who is Bad Bunny?"},
        {q:"This Netflix animated film won Best Animated Feature at the 2026 Oscars",a:"What is <i>KPop Demon Hunters</i>?"},
        {q:"This country beat Argentina in extra time to win the 2026 World Cup final",a:"What is Spain?"},
        {q:"This Ariana Grande song was Spotify’s most-streamed track of summer 2026",a:"What is “hate that i made you love me”?"},
      ]},
      { name: "Fall Facts", clues: [
        {q:"The full moon nearest the autumn equinox",a:"What is the Harvest Moon?"},
        {q:"Canada celebrates Thanksgiving in this month",a:"What is October?"},
        {q:"Despite its name, Oktoberfest mostly takes place in this month",a:"What is September?"},
        {q:"Before pumpkins, Irish immigrants carved jack-o’-lanterns out of these root vegetables",a:"What are turnips?"},
        {q:"The term “Black Friday” started in this city in the 1960s, describing the traffic and crowds",a:"What is Philadelphia?"},
      ]},
      { name: "Kitchen Know-How", clues: [
        {q:"The herb that completes “parsley, sage, rosemary and …”",a:"What is thyme?"},
        {q:"Gravy is often thickened with this paste of equal parts fat and flour",a:"What is a roux?"},
        {q:"Removing a turkey’s backbone and flattening it so it cooks faster and more evenly is called this",a:"What is spatchcocking?"},
        {q:"For the fluffiest mashed potatoes, cooks usually pick this brown-skinned variety",a:"What is a Russet?"},
        {q:"Stuffing usually starts with the French base called mirepoix: diced onion, celery, and this third vegetable",a:"What are carrots?"},
      ]},
      { name: "Christmas Countdown", clues: [
        {q:"In “A Visit from St. Nicholas,” the reindeer are Cupid, Dasher, Vixen, Donner, Comet, Prancer, Blitzen, and this one",a:"What is Dancer?"},
        {q:"Mariah Carey released “All I Want for Christmas Is You” in this year",a:"What is 1994?"},
        {q:"In <i>Home Alone</i>, Kevin’s family accidentally leaves him behind when they fly to this city",a:"What is Paris?"},
        {q:"In <i>A Christmas Story</i>, Ralphie dreams of getting this Christmas present, despite warnings that he’ll shoot his eye out",a:"What is a Red Ryder BB gun?"},
        {q:"In <i>Elf</i>, Buddy’s four main food groups are candy, candy canes, candy corn, and this",a:"What is syrup?",dd:true},
      ]},
    ]},
  ],
  final: {
    category: "Thanksgiving History",
    q: "In 1939, President Roosevelt moved Thanksgiving up a week to extend the Christmas shopping season, and critics mocked it with this nickname",
    a: "What is Franksgiving?"
  }
};
