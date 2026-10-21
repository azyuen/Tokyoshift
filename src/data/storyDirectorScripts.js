// Developer-only smoke scripts. These are NOT career canon and do not
// automatically trigger for ordinary players. No rewards or narrative flags.
export const STORY_DIRECTOR_SCRIPTS = Object.freeze({
  directorDialoguePreview: {
    id: 'directorDialoguePreview',
    title: 'STORY DIRECTOR // THREE PRESENTATIONS',
    steps: [
      { type: 'MANGA', title:'STORY DIRECTOR // MANGA TEST',
        characters:{left:'daichiSakamoto',right:'$PLAYER'},
        pages:[
          {speaker:'left',pose:'idle',text:'This conversation uses the full manga view.'},
          {speaker:'right',pose:'idle',text:'And it works over whichever location is currently on screen.'},
        ] },
      { type: 'PHONE', title:'STORY DIRECTOR // PHONE TEST',
        callerId:'sayakaFujieda',callerName:'SAYAKA',callerPose:'idle',
        presentationMode:'openingSwipe',label:'STORY DIRECTOR // INCOMING CALL',
        pages:[
          {speaker:'caller',text:'This is the incoming phone call presentation.'},
          {speaker:'player',text:'And the next line is a player response.'},
        ] },
      { type: 'COMPACT', title:'STORY DIRECTOR // COMPACT TEST',
        characters:{left:'sayakaFujieda',right:'$PLAYER'},
        autoAdvanceMs:2600,
        pages:[
          {speaker:'left',pose:'idle',text:'The compact dialogue HUD can appear over gameplay.'},
          {speaker:'right',pose:'idle',text:'Without replacing the racing screen.'},
        ] },
      { type:'END' },
    ],
  },
  directorRoutePreview: {
    id:'directorRoutePreview',
    title:'STORY DIRECTOR // MAP AND RACE TEST',
    steps:[
      {type:'LOCATION',scene:'GarageScene',data:{workshopLocationId:'shinonomeWarehouseStrip'}},
      {type:'MANGA',title:'STORY DIRECTOR // GARAGE',
        characters:{left:'daichiSakamoto',right:'$PLAYER'},
        pages:[{speaker:'left',pose:'idle',
          text:'Choose a destination from the map, then start an ordinary single race.'}]},
      {type:'OPEN_MAP'},
      {type:'WAIT_SCENE',scene:'RaceScene'},
      {type:'COMPACT',characters:{left:'sayakaFujieda',right:'$PLAYER'},
        autoAdvanceMs:2600,pages:[
          {speaker:'left',pose:'idle',text:'This conversation is running inside RaceScene.'},
          {speaker:'right',pose:'idle',text:'The race is still running.'},
        ]},
      {type:'WAIT_RACE_END'},
      {type:'MANGA',title:'STORY DIRECTOR // FINISH-LINE CINEMATIC',
        characters:{left:'daichiSakamoto',right:'$PLAYER'},
        pages:[{speaker:'left',pose:'idle',
          text:'Here is a manga cutscene after driving, still inside RaceScene.'}]},
      {type:'WAIT_SCENE',scene:'MeetScene'},
      {type:'PHONE',callerId:'sayakaFujieda',callerName:'SAYAKA',
        presentationMode:'openingSwipe',
        pages:[{speaker:'caller',text:'You are back at the meet. This call works here too.'}]},
      {type:'END'},
    ],
  },
});
