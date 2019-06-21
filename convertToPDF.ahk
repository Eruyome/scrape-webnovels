#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.
#SingleInstance, Force

; https://stackoverflow.com/questions/41242558/how-to-use-requests-cookies-in-pdftkit-wkhtmltopdf

global wkhtmltopdf := "D:\Programme\wkhtmltopdf\bin\wkhtmltopdf.exe"
global name := ""
global chapterFolder := A_ScriptDir "\chapters"

global startpos := 760	; change to start at a certain chapter

global list := A_ScriptDir "\chapters\list.txt"
FileRead, fileData, %list%
If (ErrorLevel) {
	MsgBox % "Error reading file " list
}

Progress, Off
Progress, A M, %index% / %totalLines%, Converting novels to pdf...

totalLines := 0
index := 0
Loop, Parse, fileData, `n, `r
{If (StrLen(Trim(A_LoopField)) and A_Index > startpos) {
		totalLines++
	}
}

If (starpos >= totallines) {
	MsgBox % Selected starting position is higher than the total number of chapters
}

Loop, Parse, fileData, `n, `r
{
	If (RegExMatch(A_LoopField, "i)^novel_name:(.*)", nameMatch)) {
		name := Trim(nameMatch1)
		name := RegExReplace(name, "i)\s", "_")
	}
	Else If (StrLen(Trim(A_LoopField)) and A_Index > startpos) {
		index++
		
		prog := Round((100 * index) / totalLines)
		
		If (RegExMatch(A_LoopField, "i)gravitytales|wuxiaworld")) {
			RegExMatch(A_LoopField, "mi)\/([^\/]+)\/?$", match)
			cindex := match1
		} Else {
			cindex := index + startpos
		}		

		Progress, %prog%, %index% / %totalLines% (Start chapter index: %startpos%), Converting novels to pdf...
		
		
		
		cookies := ""
		If (RegExMatch(A_LoopField, "i)wuxiaworld")) {
			cookies .= "--cookie consentId 1cab86ba-eba3-4b9d-ab75-fe5b02db9830 "
			cookies .= "--cookie euconsent BOd1rQIOd1rQSAAAAAAACK-AAAAlx7_______9______5uz_Ov_v_f__33e8__9v_l_7_-___u_-33d4-_1vf99yfm1-7ftr3tp_87ues2_Xur__59__3z3_9phPrsks9IA "
			cookies .= "--cookie gdpr consented "
			cookies .= "--cookie m2session 5101a6e8-bb07-49bc-bd34-45e9d8c0ab36 "
			cookies .= "--cookie m2hb enabled "
			cookies .= "--cookie session_depth 1 "
			cookies .= "--cookie pg_variant test "
		}		
		
		RunWait %comspec% /c "cd %chapterFolder% && %wkhtmltopdf% --no-images --lowquality %cookies% %A_LoopField% %name%_%cindex%.pdf", , Hide
	}
}

Return
