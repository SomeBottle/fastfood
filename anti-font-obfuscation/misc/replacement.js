const TARGET_ELEMENT=document.querySelector('.problem-body > .custom_ueditor_cn_body');

let htmlStr=TARGET_ELEMENT.innerHTML;
// 按照 font_uni_map 把 unicode 映射回正常文字

fetch('https://gist.githubusercontent.com/SomeBottle/fd0f81ebd9009e2b7a1299dd3bd18a61/raw/3370a0c4328a7ce45374423ed86fed18edaaba37/font_uni_map.json')
    .then(res=>res.json())
    .then(data=>{
        let resultHtml='';
        // 根据映射表替换掉 htmlStr 中的 Unicode 汉字
        for(let i=0;i<htmlStr.length;i++){
            if(/[\u4e00-\u9fff]/g.test(htmlStr[i])){
                // 如果是中文汉字
                let unicode=htmlStr.charCodeAt(i);
                // 拼接得到键
                let modifiedUni='uni'+unicode.toString(16).toUpperCase();
                console.log(`${htmlStr[i]}-${modifiedUni}`);
                if( modifiedUni in data){
                    // 映射到真实的 Unicode
                    let realUni=data[modifiedUni].slice(3); // 去掉开头的 uni
                    let realChar=String.fromCharCode('0x'+realUni);
                    resultHtml+=realChar; // 加上 0x 以按十六进制转换
                    console.log(`\t->${realChar}-${data[modifiedUni]}`);
                }else{
                    resultHtml+=htmlStr[i];
                }
            }else{
                resultHtml+=htmlStr[i];
            }
        }
        // 最后替换回去
        TARGET_ELEMENT.innerHTML=resultHtml;
    });

