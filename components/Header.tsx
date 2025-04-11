import Link from "next/link";
import Image from "next/image";
import logo from "@/images/logo.png";

function Header() {
  return (
      <div className="border-b">
        <div>
            <Link href="/" className="font-bold shrink-0">
                <Image
                    src={logo}
                    alt="Logo"
                    width={32}
                    height={32}
                    className="inline-block mr-2"
                />
                </Link>  
        </div>
      </div>
  )
}

export default Header