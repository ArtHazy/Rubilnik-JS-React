export const ViewResult = ({/*usersChoices,*/ results}) => {

  return (
    <div className="ViewResult">
      <div className="scores">
        <div className="entry"> <div>place</div><div>name</div><div>score</div> </div>
        {/* {console.log({roommates, usersScores, usersChoices})} */}
        {console.log(results)}

        {/*usersScores*/results.map((entry, index)=>
          <div key={index} className={"entry " + (index==0? "first":"")}>
            {console.log(entry)}
            <div className={"index"}> {index + 1} </div>
            <div className={"name"}> {entry.id + " : " + entry.name} </div>
            <div className={"score"}> {entry.score} </div>
          </div>)}
      </div>
    </div>
  )
}