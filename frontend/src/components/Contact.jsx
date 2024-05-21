import Avatar from "./Avatar";

export default function Contact({ id, username, onClick, selected, online }) {

    return (
        <div
            key={id}
            onClick={() => onClick(id)}
            className={
              'flex items-center gap-2 cursor-pointer rounded-lg transition-all delay-75 ease-linear ' +
              (selected
                ? 'bg-[#1C1D20] m-4 mr-0 rounded-r-none font-semibold'
                : 'm-4 bg-[#212226] hover:bg-blue-600 hover:drop-shadow-[0_1px_10px_rgba(29,78,216,0.7)] shadow-[0px_0px_10px_rgb(255,255,255,0.15)]')
            }>
            {selected && (
              <div className="w-1 bg-blue-800 h-14 rounded-l-lg"></div>
            )}
            <div className="flex gap-2 py-2 pl-4 items-center">
              <Avatar online={online} username={username} userId={id} />
              <span className="text-white text-xl tracking-wider font-semibold">{username}</span>
            </div>
        </div>
    );
}
