__author__ = 'sagar'
import json
from pprint import pprint

#load my friends
friendFile = open("data/friends.json")
friends = json.load(friendFile)

#load the mutual friends between me and each friend
mutualFile = open("data/mutualFriends.json")
mutuals = json.load(mutualFile)


#pprint (friends)
#pprint(mutuals[0])
#print (type(mutuals[0]['friends'][0]))
#print(type(friends))
friendFile.close()
mutualFile.close()

#get connections
friendID = []

#array of id's
for friend in friends:
    friendID.append(friend['id'])

links = []

for friend in mutuals:
    source = friendID.index(friend['id'])
    mutualFriends = friend['friends']

    for otherFriend in mutualFriends:
        target = friendID.index(otherFriend)
        link = {'source':source, 'target':target}
        links.append(link)

#pprint(links)

graph = {}
graph.setdefault('nodes',friends)
graph.setdefault('links',links)
pprint (graph)
with open('data/data.json', 'w') as outfile:
  json.dump(graph, outfile)
