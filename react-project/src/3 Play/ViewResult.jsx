import "./ViewResult.scss"
import winIcon from "../images/win.svg";

export const ViewResult = ({/*usersChoices,*/ results, t}) => {

  return (
    <div className="ViewResult">
      <div className="scores">
        <div className="entry"> 
          <div>{t('result.placeHeader')}</div>
          <div>{t('result.nameHeader')}</div>
          <div>{t('result.scoreHeader')}</div> 
        </div>
        {/* {console.log({roommates, usersScores, usersChoices})} */}
        {console.log(results)}

        {/*usersScores*/results.map((entry, index)=>
          <div key={index} className={"entry " + (index==0? "first":"")}>
            {console.log(entry)}
            <div className={"index"}> {index==0? <img src={winIcon} alt={t('result.winAlt')}></img> : index + 1} </div>
            <div className={"name"}> {entry.id + " " + entry.name} </div>
            <div className={"score"}> {entry.score} </div>
          </div>)}
      </div>
    </div>
  )
}