import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Shell } from "@/components/Shell"
import { Home } from "@/pages/Home"
import { Abx } from "@/pages/Abx"
import { Meds } from "@/pages/Meds"
import { Convert } from "@/pages/Convert"
import { Reversal } from "@/pages/Reversal"
import { RxCheck } from "@/pages/RxCheck"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<Home />} />
          <Route path="/abx" element={<Abx />} />
          <Route path="/meds" element={<Meds />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/reversal" element={<Reversal />} />
          <Route path="/rx-check" element={<RxCheck />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
