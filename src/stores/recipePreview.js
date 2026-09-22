import {defineStore } from 'pinia'

const API_BASE = "/api";

export const useRecipePreviewStore = defineStore('recipePreview',{
    state: () => ({
        preview : null,  // 현재 보여줄 미리보기
        loading : false, // 로딩 여부 
        errorMsg : "",  // 메세지 공백
    }),
    actions: {
        async loadPreview(rcpSeq){
            this.loading = true;
            this.errorMsg = "";
            try{
                const res=await fetch(`${API_BASE}/recipe/preview?rcp_seq=${rcpSeq}`);
                if(!res.ok) throw new Error(`미리보기 조회 실패: ${res.status}`);
                this.preview = await res.json();
            }catch (e){
                this.errorMsg ="미리보기를 불러오지 못했습니다"
                console.error(e);
            }finally{
                this.loading = null;
            }
        },
        closePreview(){
            this.preview=null;
        },
    },
})