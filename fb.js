    var json = {};
    var width = 1200;
    var height = 800;

    var svg = d3.select("#graph").append("svg")
    .attr("width", width)
    .attr("height", height);

    var force = d3.layout.force()
    .gravity(0.6)
    .distance(100)
    .charge(-200)
    .linkDistance(100)
    .linkStrength(0.4)
    .size([width, height]);


// -------------------------------------------Get friends & mutual Friends data from facebook------------------------------------



            var tempNodes = new Array();
            var tempLinks = new Array();
            var ids = new Array();
            
            
            function getFriends () {

                var link = "/me/friends";
                $("#loadMessages").append("<p> Building friends list</p>");
                FB.api(link, function  (response) {
                    tempNodes = response.data;
                    //console.log(tempNodes);
                    getMutual();                    

                });
            }


            function getMutual () {
                $("#loadMessages").append("<p> Calculating mutual friends </p>");
                $("#loadMessages").append("<p> Stealing passwords </p>");
                for (var i = 0; i < tempNodes.length; i++) {
                    ids.push(tempNodes[i].id);
                }
                
                for(var i = 0; i < ids.length; i++){
                    mutualQuery(i);
                    
                }
            }

            function mutualQuery (id) {
                var link = "/"+ids[id]+"/mutualfriends";

                FB.api(link, function (response) {
                        var mutualfriends = response.data;

                        for(var i = 0; i < mutualfriends.length; i++){
                            var friendsid = mutualfriends[i].id;
                            var friendsLocalId = ids.indexOf(friendsid);
                            var link = {source : id, target : friendsLocalId};
                            //console.log(link);
                            tempLinks.push(link);
                        }
                        if(id == tempNodes.length-1){
                            makeJSON();
                        }
                });
            }

            function makeJSON () {
                $("#loadMessages").append("<p> Just Kidding </p>");
                json = {nodes : tempNodes, links : tempLinks};
                getOtherData();
                
            }    

// ----------------------------------------End get friends & mutual Friends data from facebook------------------------------------

function drawGraph(){
    var nodeNo = json['nodes'].length;
        var linkNo = json['links'].length;
        $("#stats").html("<p> Showing "+ nodeNo +" friends and "+ linkNo +" Links </p>");
        force
        .nodes(json.nodes)
        .links(json.links)
        .start();

        var link = svg.selectAll(".link")
        .data(json.links)
        .enter()
        .append("line")
        .attr("class","link");

        var node = svg.selectAll(".node")
        .data(json.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .on("click", mouseclick)
        .on("mouseover",mouseover)
        .on("mouseout", mouseout)
        .call(force.drag);

        node.append("circle")
        .attr("r", 6)
        .style("fill", function(d){ 
            if(d.gender == "male"){
                return "#2980b9";
        }else{
            return "#e74c3c";
        }});


        force.on("tick", function() {
            link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";
        });
        });
}
function stopGraph(){
    force.stop();
}
 var mouseover = function(d) {


    var string = d.name;

    if(d.birthday != undefined){
        string += " Birthday:" + d.birthday;
    }

    if(d.hometown != undefined){
        string += " From " + d.hometown;
    }


    $("#name").html(string);
    var url = "http://graph.facebook.com/"+d.id+"/picture";
        i = new Image();
        i.src = url;
        $("#name").append(i);

    
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 16);
}

var mouseclick = function(d){
    var url = "https://www.facebook.com/"+d.id;
    window.open(url, '_blank');
}

function mouseout() {
  d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", 6);
}


//Get other data, viz gender,birthday,hometown,location of all the friends
function getOtherData(){
    $("#loadMessages").append("<p> Querying facebook for additional friends data </p>");
    var len = tempNodes.length;
    
    var males = 0;
    var friendsLoc = new Array();
  

    for(var i = 0; i < len; i++){
        var id = ids[i];
        var link = "/"+id+"?fields=gender,birthday,hometown,location";
        FB.api(link, function(response){
            //console.log(response["gender"]);
            
            var index = ids.indexOf(response["id"]);
            var gen = response["gender"];

            if(gen == "male"){
                males++;
            }

            json.nodes[index].gender = gen;
 
            json.nodes[index].birthday = response["birthday"];

            if(!(response.location == undefined || response.hometown == undefined)){
                json.nodes[index].hometown = response["hometown"].name;
                json.nodes[index].location = response["location"].name;
                var obj = {};
                obj.loc = response.location.name;
                obj.home = response.hometown.name;
                obj.id = response.id;
                friendsLoc.push(obj);    
            }
            
            if (index == len-1){
                json.males = males;
                //console.log(json);
                //console.log("friendsLoc");
                //console.log(friendsLoc);
                fillLocArrays(friendsLoc);
                

            }

        });
        


    }
}

var locArrLen;
function fillLocArrays(friendsLocArr){
    $("#loadMessages").append("<p> Getting location co-ordinates for friends</p>");
    locArrLen = friendsLocArr.length;
    for(var i = 0; i < locArrLen; i++){
        getLoc(friendsLocArr[i].home, "home",i);
        getLoc(friendsLocArr[i].loc, "locn",i);
    };
    

}

var homeCoord = new Array();
var locCoord = new Array();

function getLoc(name,type,i){

    
    $.get("http://maps.google.com/maps/api/geocode/json?address="+name+"&sensor=false",function(result,status){
        //console.log(result);
        if(result.status == "OK"){

        
        var lat = result["results"][0]["geometry"]["location"]["lat"];
        var lng = result["results"][0]["geometry"]["location"]["lng"];
        var loc = [lat,lng];

        if(type == "home"){
            homeCoord.push(loc);
        }else{
            locCoord.push(loc);
        }

        }
        
        //console.log(i);
        if(i == locArrLen-1){
            $("#loading").modal('hide');
            $("#controls").show();
        }

    });
    
}

function showLocations(){
    // console.log(homeCoord);
    // console.log(locCoord);
    console.log("home coordinates length" + homeCoord.length + " location coocrds length " + locCoord.length);
    for(var i = 0; i < homeCoord.length; i++){
        L.circle(homeCoord[i], 100, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5
        }).addTo(map);

        L.circle(locCoord[i], 100, {
            color: 'blue',
            fillColor: '#27a1b4',
            fillOpacity: 0.5
        }).addTo(map);

        L.polyline([homeCoord[i],locCoord[i]], {color: "#a8a8a8",opacity:"0.3",fillOpacity: "0.1", weight:"3"}).addTo(map);

    }
    
}

 
function calcAge(){
    $("#leafMap").hide();
    $("#ageGraph").show();
    $("#graph").hide();
    
    var len = tempNodes.length;
    var maxAge = 0
    var minAge = 50;
    var ages = new Array();

    for(var i = 0; i < len; i++){

       if(json.nodes[i].birthday != undefined){
        
         var bDate = json.nodes[i].birthday;
         console.log(bDate);
            
            var age = getAge(bDate);
            //console.log(age);
            if(age != null && !isNaN(age)){
                ages.push(age);

                if(age > maxAge){
                maxAge = age;
            }else if(age < minAge){
                minAge = age;
            }

            }

       } 
      
            
    }

    var ageFreq = new Array(maxAge - minAge + 1);
    //initialize frequencies to 0
    for(var i = 0; i < ageFreq.length; i++){
        ageFreq[i] = 0;
    }

    for(var i = 0; i < ages.length; i++){
        var index = ages[i] - 17;
        ageFreq[index] += 1;
    }

    console.log("maxage " + maxAge + " minage" + minAge);
    console.log(ageFreq);
    showAge(ageFreq,maxAge,minAge);

} 
function getAge(fbDate){
  

    var parts = fbDate.split('/');
    if(parts.length == 3){
        console.log("year " + parts[2]);
        var mydate = new Date(parts[2],parts[0]-1,parts[1]);
        var year = parts[2];
        var age = 2014 - year;
        return age;    
    }else{
        return null;
    }
     
}

function showAge(data,max,min){
                var w = 800;
                var h = 400;
                var padding = 5;
                var factor;
                if(max == min){
                    factor = 1;
                    
                }else{ 
                    factor = Math.round(200/(max-min));
                }; 
                

                var svg = d3.select("#ageGraph").append("svg").attr("width", w).attr("height", h);

                svg.selectAll(".bar")
                .data(data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x",function(d,i){return(i*(w/data.length));})
                .attr("y",function(d){
                    return(h-(300-factor*(max-d)));
                }).attr("width",(w/data.length)-padding)
                .attr("height",function(d){
                    return(300-factor*(max-d)-10);
                })
                .attr("fill", function(d){
                    var val = Math.round(max-d);
                    return "rgb(41,128,"+ (255- (50*val)) +")";
                })
                .append("title")
                .text(function(d,i) { return ("Age:" + (i + min) + "Total:" + d); });
                //rgb(41, 128, 185)

                //Add names
                svg.selectAll("text")
                .data(data)
                .enter()
                .append("text")
                .attr("x",function(d,i){return(i*(w/data.length)+(w / data.length - padding) / 2);})
                .attr("y",h)
                .attr("font-family","Century Gothic, sans-serif")
                .attr("font-size", "12px")
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .text(function(d,i){
                    return min + i;
                });

             
} 