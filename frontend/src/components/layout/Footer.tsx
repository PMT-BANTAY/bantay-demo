// frontend/src/components/layout/Footer.tsx

import footer from '../../assets/footer.png';
import bantayWhite from '../../assets/bantay-white.svg';
import PUPlogo from '../../assets/PUPlogo.png';
import Sectionlogo from '../../assets/vci2r5logo.png';
import Phone from '../../assets/phone.svg';
import Facebook from '../../assets/facebook.svg';
import Mail from '../../assets/email.svg';

const Footer = () => {
    return (
        <footer className="relative bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 bottom-0 text-white overflow-hidden">
            {/* Decorative background shapes */}
            <div className="absolute inset-0">
                <img src={footer} alt="footer"/>
            </div>

            <div className=" relative z-10 container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-between ml-10">

                    {/* Left Section - Logo and Project Info */}
                    <div className="space-y-4 ">
                        <div className="flex items-center space-x-3">
                            <img src={bantayWhite} alt="bantay white" className="w-24"/>
                            <div>
                                <h2 className="text-2xl font-bold arame">BANTAY</h2>
                                <p className="text-sm text-blue-100">Real-time Flood Propagation Mapping Platform</p>
                            </div>
                        </div>

                        <div className="text-sm text-blue-100">
                            <p className="font-medium mb-2 arame">BANTAY IS A PROJECT OF:</p>
                            <div className="flex items-center space-x-3">
                               <img src ={PUPlogo} alt="pup-logo" className='w-8 h-8'/>
                                <img src ={Sectionlogo} alt="section-logo" className='w-14 h-4'/>
                            </div>
                        </div>
                    </div>

                    {/* Middle Section - About */}
                    <div className="space-y-4 text-[#066AAA] ml-25">
                        <h3 className="text-xl font-bold arame">ABOUT</h3>
                        <p className="text-sm text-[#066AAA] leading-relaxed">
                            BANTAY is a real-time flood mapping platform inspired by Project NOAH's visualization approach but focused on real-time sensor-driven flood propagation mapping.
                        </p>
                    </div>

                    {/* Right Section - Contact */}
                    <div className="space-y-4 ml-20">
                        <h3 className="text-xl text-[#066AAA] font-bold arame">CONTACT US</h3>
                        <div className="flex space-x-4">
                           <img src={Phone} alt="phone" className="w-10 h-10" />
                            <img src={Facebook} alt="facebook" className="w-10 h-10" />
                           <img src={Mail} alt="mail" className="w-10 h-10 " />
                        
                        </div>
                    </div> 
                </div>

                {/* Bottom tagline */}
                <div className="mt-24 pt-8 border-opacity-30">
                    <p className="text-center  font-medium">
                        Intelligence Flows Where Water Goes - PMT Waters Decoded:
                    </p>
                    <p className="text-center  mt-1">
                        Pasig Flows, Marikina Knows, Tullahan Shows
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;