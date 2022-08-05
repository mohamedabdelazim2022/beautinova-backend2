import nodemailer from 'nodemailer';
import config  from '../config';


let transporter = nodemailer.createTransport({
    secure: true, 
    service:'gmail',
    ignoreTLS: true,
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'mmmm@gmail.com',
        pass: 'Utcc**1107'
    },
    /*tls:{
        rejectUnauthorized:false
      }
*/
});

export function sendEmail(targetMail, text ,description) {

    let mailOptions = {
        from: `${config.App.Name}`,
        to: targetMail,
        subject: `${config.App.Name} ${description}`,
        text: text,
        html:'<div style="background:`#eceff1`;width:`90%`;height:`600px`;margin:`auto`"><div  style="background:`#659FF1`;width:`100%`;height:`90px`"><img src="https://res.cloudinary.com/boody-car/image/upload/v1622723232/lmitrm1btxakugbr9swg.png" style="width:`130px`;margin-left:`41%`;margin-top:`1.7%`"><h1 style="text-align:`center`;display:`inline-block`;color:`#fff`;position:`absolute`;margin-top:`25px`"></h1></div><div style="background:`#fff`;width:`50%`;height:`300px`;margin-top:`5%`;margin-left:`22%`;padding:`4%`"><h4>'+ description +' : </h4><p>'+ text +'</p><div></div>'
       

    };

    console.log('targetMail', targetMail, 'options', mailOptions);

   
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
             console.log(error);
        }
        //console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });


    return true;
}
export function sendPostalEmail(targetMail,description,items) {

    let mailOptions = {
        from: `${config.App.Name}`,
        to: targetMail,
        subject: `${config.App.Name} ${description}`,
        //text: text,
        html:'<div style="width:`90%`;height:`1100px`;margin:`auto`;border: `3px solid #659ff1`;background: `#FAFAFA`"><div style="background:`#659ff1`;width:`100%`;height:`90px`"><img src="https://res.cloudinary.com/boody-car/image/upload/v1622723232/lmitrm1btxakugbr9swg.png" style="width: `130px`;margin-left:`41%`;margin-top: `1.7%`"></div><div style="height: `100px`;background: `#fff`"><p style="font-size: `18px`;text-align: `right`;margin: `0px 25px 0px 10px`;padding: `35px`">مرحبا بك هنا العديد من العقارات فى انتظارك معنا</p></div><div style="background: `#FAFAFA`;width: `90%`;height:`300px`;margin-left: `2%`;padding:`4%`;text-align: `end`">'+ items +'</div></div>'

    };
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.log('targetMail', targetMail, 'options', mailOptions);

   

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
             console.log(error);
        }
        //console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });


    return true;
}