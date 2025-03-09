export const ViewError = ({code, text}) => 
    <div className="ViewError">
        <h1>Oops</h1>
        <h1>{code}</h1>
        {text}
    </div>
export const ViewLoading = ({text})=>{

    return <div className="ViewLoading">
        <div className="vstack">
            <img style={{}} width={24} height={24} src="https://th.bing.com/th/id/OIP.pGPfH0aY_FnHNhzInv6ZXAHaHY?rs=1&pid=ImgDetMain" alt="" />
            {text}
        </div>
    </div>
}