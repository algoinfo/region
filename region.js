//ie
var ieRegion = (function() {
	var idx = 0,saveEle = null;
	return {
		//init 
		init:function(options) {
			//todo
		},
		//insert To caret
		insertToCaret:function(that,text) {
			that.focus();
			if(text && text != '')
				document.selection.createRange().text = text;			
		},		
		/**
		 * obtain the length of string before carent
		 * @param {dom} ele: the element of input or textarea 
		 * @return {numer}
		 */
		getRangePos:function(ele) {
			ele.focus();
			var r = document.selection.createRange();
			if(r == null)
					return false;	
		
			var re = ele.createTextRange(), 
				rc = re.duplicate();
				
			re.moveToBookmark(r.getBookmark());
			rc.setEndPoint('EndToStart',re);
			var n = rc.text.length;
			return {"start":n};		
		},
		/**  
		 *  set the caret pos
		 * @param {dom} ele  the element of input or textarea 
		 * @param {number} start:the start pos of range
		 * @param {number} end:the end pos of range
		 */
		setCaretPos:function(ele,start,end) {
			var range = ele.createTextRange();  
            range.collapse(true);  
            range.moveEnd('character', start);
			//u will modify it
            range.moveStart('character', start);  
            range.select();
		},
		getCaretPos:function(ele) {
			var nowStart = ieRegion.getRangePos(ele);			
			var ret = ieRegion.getPos(ele,nowStart);
		},		
		/**
		 * get the Rect accoding the number of char
		 * @param {dom} ele element of input or textarea 
		 * @param {nunber} n the number of chars
		 */
		getPos:function(ele,n) {
			var oldStart = ieRegion.getRangePos(ele);	
			if(document.selection) {
				ieRegion.setCaretPos(ele,n);
 				var sel = document.selection.createRange();
 				try{
					//fix the scroll
					var st = ele.scrollTop,sl = ele.scrollLeft,scrollTop = document.documentElement.scrollTop,scrollLeft = document.documentElement.scrollLeft;
						t = sel.boundingTop + st + scrollTop,l = sel.boundingLeft + sl + scrollLeft;
				}catch(ex) {					
					ieRegion.setCaretPos(ele,oldStart);
				}
				ieRegion.setCaretPos(ele,oldStart.start);
				return {"top":t,"left":l,"heihgt":sel.boundingHeight,"bottom":t + sel.boundingHeight};
		     } 
		}
	}
}());

//others
var w3cRegion  = (function() {
	var idx = 0,userAgent =  navigator.userAgent;
	var isOpera = userAgent.indexOf("Opera") > -1,
	    isFirefox =  userAgent.indexOf("Firefox") > -1 ;

	return {
		/**
		 * Dynamic synchronization of input or textarea 's style
		 * @param {dom} ele
		 */ 
		init:function(ele) {
			var copyStyle = ["font","width","height","padding-top","padding-left","padding-right",
							 "padding-bottom","margin-bottom","margin-top","margin-left","margin-right",
							 "border-top-width","border-right-width","border-bottom-width","border-left-width",
							 "border-top-style","border-right-style","border-bottom-style","border-left-style","word-wrap","word-break","white-space","word-spacing","letter-spacing","overflow-x"];
							 
			if($(ele).css("font") == '') {
				copyStyle.push("font-size");
				copyStyle.push("font-family");
			}
			if(!$("#simuLayer")[0]) {
				//simulate layer
				simuLayer = $('<div class="" id="simuLayer" style="opacity:0;z-index:-10;overflow-y:auto;position:absolute"><span class="before"></span><span style="visibility:hidden" class="mid"></span><span class="after"></span></div>');
				$("body").append(simuLayer);				
			}

			for(var i = 0, len = copyStyle.length; i < len; i++) {
				simuLayer.css(copyStyle[i],$(ele).css(copyStyle[i]));
			}

			//widht  
			var w = parseInt($(ele).css("width")), realWidth = ( w + ele.offsetWidth  - parseInt($(ele).css("border-left-width")) - parseInt($(ele).css("border-right-width")) - ele.clientWidth) || w; 
			
			//set the position of simulayer as same as the input
			simuLayer.css({"top":$(ele).position().top,"left":$(ele).position().left,"width": w + "px"});
		},
		getRangePos:function(ele) {
			return {"start":ele.selectionStart,"end":ele.selectionEnd};
		},
		getCaretPos:function(ele) {
			return w3cRegion.getPos(ele,w3cRegion.getRangePos(ele).start);
		},
		/**
		 * get the position of the input
		 * @param {dom}  ele: element of the input
		 * @return {Rect}
		 */
		getPos:function(ele,left) {
			$(ele).parent().prepend(simuLayer);
			simuLayer.show().css("visibility","hidden");
			this.copyThat(ele,left);			
			
			var m = simuLayer.find(".before").html().replace(/ /g,"<span style='white-space:pre-wrap;'> </span>");
			simuLayer.find(".before").html(m);
			
			if(simuLayer.find(".mid").text() == ' ') {
				simuLayer.find(".mid").html("<span style='white-space:pre-wrap;'> </span>");
			}

			//simulate layer's scroll
			var tscroll = ele.scrollTop;	
			simuLayer[0].scrollTop = tscroll;

			//body's scrolla
			var scrollTop = document.body.scrollTop || document.documentElement.scrollTop, scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
			
			var simCaretPos  = {},
				pos = simuLayer.find(".mid")[0].getBoundingClientRect(),
				eleScrollLeft = $(ele).scrollLeft(),		
				eleScrollTop = $(ele).scrollTop();

			//clone Rect
			for(i in pos) {
				simCaretPos[i] = pos[i];
			}
			simCaretPos.scrollTop = scrollTop;
			simCaretPos.scrollLeft = scrollLeft;
			
			if(isFirefox) {
				//firefox should be minus the input's scrollTop
			 	simCaretPos.top = parseInt (simCaretPos.top) - parseInt(eleScrollTop);
			 	simCaretPos.eleScrollTop = eleScrollTop;
			} else {
				simCaretPos.eleScrollTop = 0;
			}
			
			//plus the scroll
			simCaretPos.posTop = simCaretPos.top + scrollTop;
			simCaretPos.posBottom = simCaretPos.top + scrollTop;
			simCaretPos.posLeft = simCaretPos.left + scrollLeft;
			simCaretPos.posRight = simCaretPos.right + scrollLeft;	
			
			//in firefox can't not get the input's scrollLeft. so simulate it 
			if((isFirefox || isOpera) && ele.nodeName.toLowerCase() == "input") {
				$("#simuLayer").show();
				var ofx = $("#simuLayer").css("overflow-x");
				if(ofx == 'scroll') {
					simuLayer[0].scrollLeft = 1000;
					var simLeft = simuLayer.scrollLeft();
				} else {
					simuLayer.css("overflow-x","scroll");
					simuLayer[0].scrollLeft = 1000;
					var simLeft = simuLayer.scrollLeft();
					simuLayer.css("overflow-x",ofx).hide();
				}
				l = l - simLeft || 0;
			}
			simuLayer.hide();
			return simCaretPos;
		},
		/**		 
		 * copy the text to the simulate layer
		 * @param {dom} ele:input's element
		 * @param {number} l:the length of the caret
		 */
		copyThat:function(ele,l) {
			var str = ele.value;

	
			var ref = l >=0 ? l : this.getRangePos(ele).start; //ref position
			//the text before the ref
			var leftStr = str.substring(0,ref).replace(/\n/g,"<br/>");
			simuLayer.find(".before").html(leftStr);
			
			//opera recognize \n  as two character
			if(isOpera) {
				str = str.replace(/\n/g,"\n");
			}
		
			var midStr = str.charAt(ref).replace(/\n/g,"<br/>") || '';
			//fix the left chacter is \n
			if(midStr == '<br/>') {	
				midStr += '@';
			}
			$(".mid").html(midStr);	

			//the text after ref
			var rightStr = str.substring(ref+1) || '';
			$(".after").html(rightStr.replace(/\n/g,"<br/>"));

			var tscroll = ele.scrollTop;	
			simuLayer[0].scrollTop = tscroll;
		},		
		//reset the position of caret
		setCaretPos:function(ele,start,end) {
			ele.focus();
			ele.setSelectionRange(start,start);					
		},
		/**
		 * insert the text in the position of caret
		 * @param {dom}  ele:the element of input
		 * @param {string} text: inserted text
		 */
		insertToCaret:function(ele,text) {
			if(text == '') return
			
			var l = ele.selectionStart,
				str = ele.value,
				strLeft = str.substring(0,l),
				strRight = str.substring(l);
				
			//insert
			var	start = ele.selectionStart + text.length;
			ele.value = strLeft + text + strRight;	
			
			//reset the position of caret		
			w3cRegion.setCaretPos(ele,start,start);				
		}
	}
}());

if($.browser.msie) {
	where = ieRegion;
} else {
	where = w3cRegion;
}